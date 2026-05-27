# syntheticdata — Synthetic Tabular Data Generation as a Service

> Wikolabs AI Platform · Docker Compose VM · Port 3040 · Next.js 14 + FastAPI · CTGAN / TVAE / GaussianCopula

---

## Table of Contents

1. [Vision produit](#1-vision-produit)
2. [User Stories](#2-user-stories)
3. [Business Rules](#3-business-rules)
4. [Architecture Overview](#4-architecture-overview)
5. [Mono-repo Structure](#5-mono-repo-structure)
6. [Generative Models Specification](#6-generative-models-specification)
7. [UML Diagrams](#7-uml-diagrams)
8. [API Reference](#8-api-reference)
9. [UI Simulation Guide](#9-ui-simulation-guide)
10. [Database Schema](#10-database-schema)
11. [Infrastructure & Deployment](#11-infrastructure--deployment)
12. [CI/CD Pipeline](#12-cicd-pipeline)
13. [Kaggle Dataset](#13-kaggle-dataset)
14. [Local Development](#14-local-development)

---

## 1. Vision produit

### Problème métier

Les entreprises font face à un dilemme croissant entre exploitation de la donnée et conformité réglementaire :

- Le **RGPD** (Europe) et le **CCPA** (Californie) interdisent le partage de données personnelles entre équipes ou avec des partenaires externes
- Les équipes ML manquent de données d'entraînement représentatives, surtout pour les classes minoritaires
- Le **data leakage** entre jeux train/test est un risque majeur dans les pipelines ML modernes
- Les tests de systèmes en staging nécessitent des données réalistes mais non personnelles

La donnée synthétique résout ces problèmes : elle préserve les propriétés statistiques du jeu original sans contenir d'individus réels.

### Solution

**syntheticdata** génère de la donnée tabulaire synthétique à partir d'un dataset CSV réel. L'utilisateur uploade son fichier, choisit un modèle génératif (CTGAN, TVAE ou GaussianCopula), configure la génération, et télécharge un dataset synthétique avec un rapport de qualité complet.

### Proposition de valeur

| Besoin | syntheticdata |
|---|---|
| Partager des données avec des tiers | Données synthétiques RGPD-compliant |
| Augmenter le dataset ML (classes rares) | Générer 10x la taille originale |
| Tester en staging avec données réalistes | Dataset synthétique identique en structure |
| Éviter le leakage train/test | Train synthétique, test sur données réelles |
| Anonymiser pour audit ou publication | Score MIA < 0.55 garanti |

### Cas d'usage cibles

- **Banques et assurances** : partager des données de scoring avec des partenaires analytiques
- **Santé** : données patients synthétiques pour la recherche clinique
- **Retail** : augmentation des données de fraude (classe très minoritaire)
- **RH** : données employés pour tests de systèmes SIRH
- **Fintechs** : données transactions pour ML anti-fraude en staging

---

## 2. User Stories

### Rôles

- **Data Analyst** : prépare et configure la génération
- **ML Engineer** : utilise les données synthétiques pour l'entraînement
- **Data Protection Officer (DPO)** : valide la conformité RGPD
- **DevOps** : administre la plateforme

### Epic 1 — Import et configuration des données

| ID | En tant que | Je veux | Afin de |
|---|---|---|---|
| US-001 | Data Analyst | uploader un fichier CSV ou Excel | démarrer la génération depuis mes données |
| US-002 | Data Analyst | voir la détection automatique des types de colonnes | valider le typage avant la génération |
| US-003 | Data Analyst | modifier manuellement le type d'une colonne | corriger les erreurs de détection automatique |
| US-004 | DPO | marquer les colonnes PII pour les masquer | garantir l'anonymisation des données sensibles |

### Epic 2 — Configuration du modèle génératif

| ID | En tant que | Je veux | Afin de |
|---|---|---|---|
| US-005 | ML Engineer | choisir entre CTGAN, TVAE et GaussianCopula | adapter le modèle à mon type de données |
| US-006 | Data Analyst | configurer le nombre de lignes à générer (jusqu'à 10x) | contrôler la taille du dataset synthétique |
| US-007 | ML Engineer | activer la génération conditionnelle avec des contraintes | générer uniquement des profils selon des critères |
| US-008 | ML Engineer | sauvegarder le random seed d'un job | reproduire exactement la même génération |

### Epic 3 — Qualité et conformité

| ID | En tant que | Je veux | Afin de |
|---|---|---|---|
| US-009 | DPO | voir le score MIA (Membership Inference Attack) | valider que les données synthétiques sont anonymes |
| US-010 | Data Analyst | voir les métriques JS divergence et KS-test par colonne | valider la fidélité statistique |
| US-011 | ML Engineer | voir la matrice de corrélation réelle vs synthétique | vérifier que les relations entre variables sont préservées |
| US-012 | Data Analyst | télécharger le rapport qualité HTML complet | partager le rapport avec les parties prenantes |

### Epic 4 — Export et intégration

| ID | En tant que | Je veux | Afin de |
|---|---|---|---|
| US-013 | ML Engineer | exporter en CSV, JSON ou via insert PostgreSQL direct | intégrer dans mon pipeline ML |
| US-014 | ML Engineer | générer un train synthétique en gardant le test réel | éviter le data leakage dans mon pipeline ML |
| US-015 | DevOps | accéder à la plateforme sur le port 3040 via Docker Compose | déployer sur VM sans Kubernetes |

---

## 3. Business Rules

### BR-001 — Formats d'entrée supportés

```
CSV    : détection auto du séparateur (, ; | TAB)
Excel  : .xlsx, .xls — lecture via openpyxl
Taille : max 500 Mo, max 1 million de lignes
```

### BR-002 — Détection automatique des types de colonnes

```python
TYPE_DETECTION_RULES = {
    "numerical":    lambda col: col.dtype in [float64, int64],
    "categorical":  lambda col: col.nunique() / len(col) < 0.05,
    "boolean":      lambda col: col.nunique() <= 2,
    "datetime":     lambda col: pd.to_datetime(col, errors="coerce").notna().mean() > 0.8,
    "id":           lambda col: col.nunique() == len(col)  # clé primaire détectée
}
```

### BR-003 — Choix du modèle

| Modèle | Meilleur pour | Temps entraînement | RAM |
|---|---|---|---|
| CTGAN | Données catégorielles déséquilibrées | Lent (300 epochs) | 4-8 Go |
| TVAE | Distributions continues, données mixtes | Moyen (100 epochs) | 2-4 Go |
| GaussianCopula | Données quasi-normales, vitesse | Rapide (< 1 min) | < 1 Go |

### BR-004 — Configuration CTGAN

```python
ctgan = CTGAN(
    epochs=300,
    batch_size=500,
    generator_dim=(256, 256),
    discriminator_dim=(256, 256),
    generator_lr=2e-4,
    discriminator_lr=2e-4,
    discriminator_steps=1,
    pac=10
)
```

### BR-005 — Génération conditionnelle

```python
# Exemple : générer uniquement des individus > 60 ans avec income > 50k
conditions = Condition(
    num_rows=1000,
    column_values={"age": 65, "income_bracket": ">50K"}
)
synthetic_data = ctgan.sample_conditions(conditions=[conditions])
```

### BR-006 — Métriques de qualité (fidélité)

```python
quality_metrics = {
    # Jensen-Shannon divergence par colonne (0 = identique, 1 = totalement différent)
    "js_divergence": {col: jsd(real[col], synthetic[col]) for col in columns},

    # Kolmogorov-Smirnov test (p > 0.05 = distributions similaires)
    "ks_test": {col: ks_2samp(real[col], synthetic[col]) for col in numerical_cols},

    # Delta Pearson correlation matrix
    "correlation_delta": abs(real.corr() - synthetic.corr()).mean().mean()
}
```

### BR-007 — Score de confidentialité (MIA)

```python
# Membership Inference Attack : entraîner un classifieur à distinguer réel vs synthétique
# Score proche de 0.5 = pas de différence (anonyme)
# Score > 0.7 = données synthétiques trop proches du réel (risque RGPD)
MIA_THRESHOLD = 0.55  # seuil de conformité imposé par la plateforme
```

### BR-008 — Masquage des colonnes PII

```python
# Colonnes marquées comme PII → remplacement par données Faker
PII_GENERATORS = {
    "name":     faker.name,
    "email":    faker.email,
    "phone":    faker.phone_number,
    "address":  faker.address,
    "ssn":      faker.ssn,
    "iban":     faker.iban
}
```

### BR-009 — Ratio de génération

```
Minimum : même nombre de lignes que le dataset original
Maximum : 10x le nombre de lignes du dataset original
UUID auto-généré pour chaque ligne synthétique (pas de réutilisation des IDs réels)
```

### BR-010 — Formats d'export

```
CSV          : fichier CSV avec header identique au dataset original
JSON         : tableau JSON [{col: val, ...}]
PostgreSQL   : INSERT batch direct via connection string fournie par l'utilisateur
```

### BR-011 — Train/Test Split synthétique

```python
# Option activée : générer uniquement le train synthétique
# Test = données réelles (no leakage)
X_train_synth, X_test_real = train_test_split(real_data, test_size=0.2)
X_train_synthetic = ctgan.sample(len(X_train_synth))
```

### BR-012 — Reproductibilité

```python
RANDOM_SEED = 42  # sauvegardé avec chaque job
np.random.seed(RANDOM_SEED)
torch.manual_seed(RANDOM_SEED)
ctgan = CTGAN(epochs=300, random_state=RANDOM_SEED)
```

---

## 4. Architecture Overview

```
Browser / Client — Port 3040
Next.js 14 · TypeScript · Tailwind CSS · Recharts
        |
        | HTTP (port 3040 via nginx reverse proxy)
        v
FastAPI Backend (Python 3.11) — Port 8000 interne
/api/datasets  /api/jobs  /api/quality  /api/export
SDV (CTGAN, TVAE, GaussianCopula) · pandas
scipy · ydata-profiling · Faker
        |
        v
PostgreSQL — Port 5432 interne
Datasets, Jobs, Quality Reports

Infrastructure : Docker Compose sur VM
Pas de Kubernetes, pas de Cloud Run GPU
CPU sufficient pour datasets petits et moyens (< 100k lignes)
```

---

## 5. Mono-repo Structure

```
syntheticdata/
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx                    # Dashboard jobs
│   │   ├── upload/page.tsx             # Import dataset
│   │   ├── configure/[id]/page.tsx     # Config modèle
│   │   ├── quality/[id]/page.tsx       # Rapport qualité
│   │   └── export/[id]/page.tsx        # Téléchargement
│   └── src/components/
│       ├── DatasetUploader.tsx         # CSV/Excel drag and drop
│       ├── ColumnTypeEditor.tsx        # Tableau types colonnes
│       ├── ModelSelector.tsx           # CTGAN/TVAE/GaussianCopula
│       ├── GenerationConfig.tsx        # Rows, seed, conditions
│       ├── DistributionChart.tsx       # Recharts réel vs synthétique
│       ├── CorrelationHeatmap.tsx      # Delta matrice corrélations
│       └── QualityReport.tsx           # Score MIA + métriques
│
├── backend/
│   └── app/
│       ├── main.py
│       ├── api/
│       │   ├── datasets.py             # Upload, type detection
│       │   ├── jobs.py                 # Generation job management
│       │   ├── quality.py              # MIA, JS divergence, KS
│       │   └── export.py             # CSV/JSON/PostgreSQL
│       └── ml/
│           ├── ctgan_trainer.py        # CTGAN wrapper
│           ├── tvae_trainer.py         # TVAE wrapper
│           ├── copula_trainer.py       # GaussianCopula
│           ├── quality_evaluator.py    # MIA score, métriques
│           ├── pii_masker.py           # Faker PII replacement
│           └── profiler.py            # ydata-profiling
│
├── .github/
│   └── workflows/
│       └── ci-deploy.yml
├── docker-compose.yml                 # Port 3040 expose
├── nginx.conf                         # Reverse proxy
└── README.md
```

---

## 6. Generative Models Specification

### CTGAN (Conditional Tabular GAN)

```python
from sdv.single_table import CTGANSynthesizer
from sdv.metadata import SingleTableMetadata

metadata = SingleTableMetadata()
metadata.detect_from_dataframe(real_data)

synthesizer = CTGANSynthesizer(
    metadata,
    epochs=300,
    batch_size=500,
    generator_dim=(256, 256),
    discriminator_dim=(256, 256),
    pac=10,
    verbose=True
)
synthesizer.fit(real_data)
synthetic_data = synthesizer.sample(num_rows=len(real_data))
```

**Principe :** GAN conditionnel — le générateur apprend à créer des lignes réalistes, le discriminateur apprend à les distinguer des vraies. Converge après 300 epochs.

### TVAE (Tabular Variational Autoencoder)

```python
from sdv.single_table import TVAESynthesizer

synthesizer = TVAESynthesizer(
    metadata,
    epochs=100,
    batch_size=500,
    compress_dims=(128, 128),
    decompress_dims=(128, 128),
    embedding_dim=128
)
```

**Principe :** Autoencoder variationnel — encode les données dans un espace latent continu, decode pour générer de nouvelles lignes. Plus rapide que CTGAN, meilleures distributions continues.

### GaussianCopula

```python
from sdv.single_table import GaussianCopulaSynthesizer

synthesizer = GaussianCopulaSynthesizer(
    metadata,
    numerical_distributions={
        "age": "norm",
        "income": "gamma"
    },
    default_distribution="norm"
)
```

**Principe :** Modèle statistique paramétrique. Entraînement instantané. Idéal pour les données quasi-normales. Hypothèse de linéarité des corrélations.

---

## 7. UML Diagrams

### 7.1 CTGAN Architecture Diagram

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'primaryColor': '#065f46', 'tertiaryColor': '#0f172a'}}}%%
flowchart TB
    classDef input fill:#1e3a5f,stroke:#3b82f6,color:#fff
    classDef transform fill:#374151,stroke:#9ca3af,color:#fff
    classDef gan fill:#4a1d96,stroke:#a78bfa,color:#fff
    classDef output fill:#7c2d12,stroke:#f97316,color:#fff

    A[Real Tabular Data]:::input --> B[Data Transformer\nmode normalization\none-hot encoding]:::transform
    B --> C[Training Data\nBatches]:::transform

    subgraph GAN Training Loop
        D([Generator\nMLP 256x256]):::gan -->|fake rows| E([Discriminator\nMLP 256x256]):::gan
        C -->|real rows| E
        E -->|discriminator loss| D
        E -->|wasserstein loss| D
    end

    C --> D
    D -->|converged 300 epochs| F[Trained Generator]:::gan
    F --> G[Sample N rows\nconditional or unconditional]:::output
    G --> H[Inverse Transform\ndecode categories\ndenormalize]:::transform
    H --> I[Synthetic Dataset]:::output
```

### 7.2 Generation Pipeline Flowchart

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'primaryColor': '#065f46'}}}%%
flowchart TD
    classDef user fill:#1e3a5f,stroke:#3b82f6,color:#fff
    classDef process fill:#14532d,stroke:#22c55e,color:#fff
    classDef model fill:#4a1d96,stroke:#a78bfa,color:#fff
    classDef quality fill:#7c2d12,stroke:#f97316,color:#fff

    A[Upload CSV/Excel]:::user --> B[Auto-detect column types\nnumerical categorical boolean datetime]:::process
    B --> C[Mark PII columns\nFaker replacement]:::user
    C --> D[Choose model\nCTGAN TVAE GaussianCopula]:::user
    D --> E[Set config\nrows ratio seed conditions]:::user
    E --> F{Model training}
    F -->|CTGAN 300 epochs| G[CTGAN Synthesizer]:::model
    F -->|TVAE 100 epochs| H[TVAE Synthesizer]:::model
    F -->|GaussianCopula| I[Copula Synthesizer]:::model
    G --> J[Generate N rows]:::process
    H --> J
    I --> J
    J --> K[PII masking\nFaker replace]:::process
    K --> L[Quality evaluation\nMIA score JS divergence KS-test]:::quality
    L --> M{MIA score < 0.55?}
    M -->|Yes| N[Quality Report HTML]:::quality
    M -->|No| O[Warning: privacy risk\nre-generate or adjust]:::quality
    N --> P[Export CSV JSON PostgreSQL]:::user
```

### 7.3 Quality Evaluation Sequence

```mermaid
%%{init: {'theme': 'dark'}}%%
sequenceDiagram
    participant User
    participant API
    participant QEval as Quality Evaluator
    participant MIA as MIA Classifier
    participant Profiler as ydata-profiling
    participant DB as PostgreSQL

    User->>API: POST /jobs/{id}/evaluate
    API->>QEval: evaluate(real_data, synthetic_data)

    par JS Divergence
        QEval->>QEval: compute JS divergence per column
    and KS-Test
        QEval->>QEval: compute KS test p-values
    and Correlation Delta
        QEval->>QEval: abs(real.corr() - synth.corr())
    end

    QEval->>MIA: train classifier real vs synthetic
    MIA-->>QEval: mia_score (0.5=anonymous, 1.0=leaked)

    QEval->>Profiler: generate HTML report
    Profiler-->>QEval: report.html

    QEval-->>API: quality_report + mia_score
    API->>DB: INSERT quality_reports
    API-->>User: report URL + metrics JSON
```

### 7.4 Entity-Relationship Diagram

```mermaid
%%{init: {'theme': 'dark'}}%%
erDiagram
    DATASET {
        uuid id PK
        string name
        string file_path
        int row_count
        int column_count
        jsonb column_metadata
        jsonb pii_columns
        string status
        timestamp uploaded_at
    }
    GENERATION_JOB {
        uuid id PK
        uuid dataset_id FK
        string model_type
        jsonb model_config
        int target_rows
        int random_seed
        jsonb conditions
        string status
        float training_duration_seconds
        timestamp started_at
        timestamp completed_at
    }
    SYNTHETIC_DATASET {
        uuid id PK
        uuid job_id FK
        string file_path
        int row_count
        float mia_score
        jsonb js_divergence
        jsonb ks_test_results
        float correlation_delta
        boolean privacy_compliant
        timestamp created_at
    }
    QUALITY_REPORT {
        uuid id PK
        uuid synthetic_dataset_id FK
        string html_report_path
        float overall_quality_score
        timestamp generated_at
    }
    EXPORT {
        uuid id PK
        uuid synthetic_dataset_id FK
        string format
        string file_path
        int file_size_bytes
        timestamp created_at
    }

    DATASET ||--o{ GENERATION_JOB : trains
    GENERATION_JOB ||--o| SYNTHETIC_DATASET : produces
    SYNTHETIC_DATASET ||--o| QUALITY_REPORT : has
    SYNTHETIC_DATASET ||--o{ EXPORT : exported_as
```

---

## 8. API Reference

### Base URL : `http://your-vm-ip:3040/api/v1`

#### POST /datasets/upload

Upload d'un fichier CSV ou Excel.

```http
POST /datasets/upload
Content-Type: multipart/form-data

file: <CSV or Excel file>
name: "adult_income_2024"
```

Response 200:

```json
{
  "dataset_id": "ds_3a7c9f",
  "row_count": 48842,
  "column_count": 15,
  "column_metadata": {
    "age": {"type": "numerical", "min": 17, "max": 90, "mean": 38.6},
    "workclass": {"type": "categorical", "unique_values": 9},
    "income": {"type": "categorical", "unique_values": 2, "is_target": true}
  },
  "detected_pii": ["name", "fnlwgt"],
  "profile_report_url": "/reports/ds_3a7c9f/profile.html"
}
```

#### POST /jobs/start

Lance un job de génération synthétique.

```http
POST /jobs/start
Content-Type: application/json

{
  "dataset_id": "ds_3a7c9f",
  "model_type": "ctgan",
  "model_config": {
    "epochs": 300,
    "batch_size": 500
  },
  "target_rows": 48842,
  "random_seed": 42,
  "pii_columns": ["name", "fnlwgt"],
  "conditions": null
}
```

Response 202:

```json
{
  "job_id": "job_b8d1e3",
  "status": "training",
  "estimated_minutes": 18,
  "model_type": "ctgan"
}
```

#### GET /jobs/{job_id}/status

```json
{
  "job_id": "job_b8d1e3",
  "status": "training",
  "progress_pct": 67,
  "current_epoch": 201,
  "total_epochs": 300,
  "estimated_remaining_seconds": 240
}
```

#### POST /jobs/{job_id}/evaluate

Lance l'évaluation qualité après génération.

```json
Response 200:
{
  "synthetic_dataset_id": "sd_4f2a1c",
  "mia_score": 0.51,
  "privacy_compliant": true,
  "js_divergence": {
    "age": 0.02,
    "income": 0.03,
    "education": 0.01
  },
  "ks_test": {
    "age": {"statistic": 0.018, "p_value": 0.72},
    "hours_per_week": {"statistic": 0.021, "p_value": 0.61}
  },
  "correlation_delta": 0.04,
  "overall_quality_score": 0.89,
  "report_url": "/reports/sd_4f2a1c/quality.html"
}
```

#### POST /export/{synthetic_dataset_id}

Export du dataset synthétique.

```http
POST /export/sd_4f2a1c
Content-Type: application/json

{
  "format": "csv",
  "include_header": true
}
```

Response 200: fichier CSV en streaming.

#### POST /export/{synthetic_dataset_id}/postgres

Insert direct dans une base PostgreSQL.

```http
POST /export/sd_4f2a1c/postgres
Content-Type: application/json

{
  "connection_string": "postgresql://user:pass@host:5432/mydb",
  "table_name": "adult_income_synthetic",
  "if_exists": "append"
}
```

Response 200:

```json
{
  "rows_inserted": 48842,
  "table": "adult_income_synthetic",
  "duration_seconds": 4.2
}
```

#### POST /jobs/conditional

Génération conditionnelle.

```http
POST /jobs/conditional
Content-Type: application/json

{
  "dataset_id": "ds_3a7c9f",
  "model_type": "ctgan",
  "conditions": {
    "age": {"operator": "gt", "value": 60},
    "income": ">50K"
  },
  "target_rows": 5000,
  "random_seed": 42
}
```

---

## 9. UI Simulation Guide

### Écran 1 — Dataset Upload & Column Type Editor

Objectif : uploader un CSV et configurer les types de colonnes.

- Drag & drop zone CSV/Excel avec preview du tableau (10 premières lignes)
- Tableau des colonnes : nom, type détecté, bouton override, checkbox PII
- Badges couleurs : numerical (bleu), categorical (vert), datetime (orange), boolean (gris)
- Avertissement PII détecté (colonne probable clé primaire ou email)
- Bouton Générer le profil YData → ouvre le rapport HTML dans un onglet

### Écran 2 — Configuration du modèle

Objectif : choisir le modèle et configurer la génération.

- Cards modèles : CTGAN / TVAE / GaussianCopula avec description et time estimate
- Slider Nombre de lignes : 1x à 10x le dataset original
- Input Random Seed (avec bouton randomize)
- Section Génération conditionnelle : builder de filtres (colonne + opérateur + valeur)
- Toggle Train/Test split synthétique (train synthétique, test réel)
- Card Résumé : modèle, lignes, estimé durée, bouton Lancer

### Écran 3 — Progression de la génération

Objectif : suivre l'entraînement et la génération.

- Barre de progression : epochs / total_epochs pour CTGAN/TVAE
- Badge statut : TRAINING / GENERATING / EVALUATING / DONE
- Chart en temps réel : generator_loss et discriminator_loss (CTGAN)
- ETA mis à jour toutes les 10 epochs

### Écran 4 — Rapport qualité

Objectif : valider la fidélité statistique et la conformité RGPD.

- Score global de qualité : gauge circulaire 0-100%
- Badge MIA Score : vert si < 0.55, rouge si >= 0.55
- Tableau JS Divergence par colonne avec barre de progression
- Charts Recharts : distribution réelle (bleu) vs synthétique (orange) par colonne
- Heatmap corrélations : réelle vs synthétique côte à côte
- Bouton Télécharger rapport HTML

### Écran 5 — Export

Objectif : télécharger le dataset synthétique.

- Tabs : CSV / JSON / PostgreSQL
- Preview des 10 premières lignes générées
- Bouton Télécharger CSV (progress bar)
- Form PostgreSQL : connection string + table name + if_exists (append/replace)
- Bouton Copier la commande d'import Python

---

## 10. Database Schema

```sql
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    row_count INTEGER,
    column_count INTEGER,
    column_metadata JSONB,
    pii_columns JSONB,
    status VARCHAR(50) DEFAULT 'uploaded',
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES datasets(id),
    model_type VARCHAR(50) NOT NULL,
    model_config JSONB NOT NULL,
    target_rows INTEGER NOT NULL,
    random_seed INTEGER DEFAULT 42,
    conditions JSONB,
    status VARCHAR(50) DEFAULT 'queued',
    training_duration_seconds FLOAT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE TABLE synthetic_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES generation_jobs(id),
    file_path VARCHAR(500),
    row_count INTEGER,
    mia_score FLOAT,
    js_divergence JSONB,
    ks_test_results JSONB,
    correlation_delta FLOAT,
    privacy_compliant BOOLEAN,
    overall_quality_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quality_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synthetic_dataset_id UUID REFERENCES synthetic_datasets(id),
    html_report_path VARCHAR(500),
    overall_quality_score FLOAT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synthetic_dataset_id UUID REFERENCES synthetic_datasets(id),
    format VARCHAR(20) NOT NULL,
    file_path VARCHAR(500),
    file_size_bytes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_dataset ON generation_jobs(dataset_id);
CREATE INDEX idx_synthetic_job ON synthetic_datasets(job_id);
```

---

## 11. Infrastructure & Deployment

### Docker Compose — VM (port 3040)

```yaml
version: '3.9'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "3040:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on: [frontend, backend]

  frontend:
    build: ./frontend
    expose: ["3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://your-vm-ip:3040/api/v1

  backend:
    build: ./backend
    expose: ["8000"]
    environment:
      - DATABASE_URL=postgresql://synth:synth@db:5432/syntheticdata
      - DATA_DIR=/app/data
    volumes:
      - synth_data:/app/data
    depends_on: [db]

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: synth
      POSTGRES_PASSWORD: synth
      POSTGRES_DB: syntheticdata
    volumes: [pgdata:/var/lib/postgresql/data]
    expose: ["5432"]

volumes:
  pgdata:
  synth_data:
```

### nginx.conf

```nginx
events { worker_connections 1024; }

http {
  upstream frontend { server frontend:3000; }
  upstream backend  { server backend:8000; }

  server {
    listen 80;
    client_max_body_size 500M;

    location /api/ {
      proxy_pass http://backend/;
      proxy_read_timeout 600s;
    }

    location / {
      proxy_pass http://frontend/;
    }
  }
}
```

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.30.0
sdv==1.12.0
pandas==2.2.2
numpy==1.26.4
scipy==1.13.0
scikit-learn==1.5.0
ydata-profiling==4.8.3
faker==25.2.0
openpyxl==3.1.4
sqlalchemy==2.0.30
asyncpg==0.29.0
psycopg2-binary==2.9.9
alembic==1.13.1
pydantic==2.7.1
torch==2.2.0
```

### Déploiement sur VM

```bash
# Sur la VM cible
git clone https://github.com/Wikolabs/syntheticdata.git
cd syntheticdata

# Configurer les variables
cp .env.example .env
# Editer DATABASE_URL, etc.

# Lancer
docker compose up -d

# Vérifier
curl http://localhost:3040/api/v1/health
# {"status": "ok", "version": "1.0.0"}
```

---

## 12. CI/CD Pipeline

```yaml
# .github/workflows/ci-deploy.yml
name: CI and Deploy syntheticdata

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: {POSTGRES_USER: test, POSTGRES_PASSWORD: test, POSTGRES_DB: synth_test}
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: '3.11'}
      - run: pip install -r backend/requirements.txt pytest pytest-asyncio httpx
      - run: pytest backend/tests/ -v
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/synth_test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: '20'}
      - run: npm ci && npm run build
        working-directory: frontend

  deploy:
    needs: [test, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH to VM
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VM_HOST }}
          username: ${{ secrets.VM_USER }}
          key: ${{ secrets.VM_SSH_KEY }}
          script: |
            cd /opt/syntheticdata
            git pull origin main
            docker compose build
            docker compose up -d
            docker compose ps
```

---

## 13. Kaggle Dataset

**Dataset : adult-income-dataset (Census Income)**

| Attribut | Valeur |
|---|---|
| Source | UCI Machine Learning Repository via Kaggle |
| Lignes | 48 842 observations |
| Colonnes | 15 colonnes : age, workclass, fnlwgt, education, education-num, marital-status, occupation, relationship, race, sex, capital-gain, capital-loss, hours-per-week, native-country, income |
| Cible | income (<=50K ou >50K) |
| Types | 6 numériques + 9 catégorielles |
| Licence | Domaine public (UCI) |

**Pourquoi ce dataset est idéal pour syntheticdata :**
- Mix équilibré numérique / catégoriel → teste tous les modèles SDV
- Déséquilibre de classes (75% <=50K) → teste CTGAN conditionnel
- Colonnes sensibles (race, sex, native-country) → teste le masquage PII
- 48k lignes → temps d'entraînement raisonnable (< 20 min CTGAN)
- Benchmark établi → comparaison facile réel vs synthétique

**Téléchargement :**

```bash
pip install kaggle
kaggle datasets download -d uciml/adult-census-income
unzip adult-census-income.zip -d backend/data/raw/
```

**Utilisation dans les tests :**

```python
import pandas as pd
from sdv.single_table import CTGANSynthesizer
from sdv.metadata import SingleTableMetadata

real_data = pd.read_csv("backend/data/raw/adult.csv")
metadata = SingleTableMetadata()
metadata.detect_from_dataframe(real_data)

synth = CTGANSynthesizer(metadata, epochs=10)  # 10 epochs pour les tests
synth.fit(real_data)
synthetic_data = synth.sample(num_rows=1000)
```

---

## 14. Local Development

### Prérequis

- Python 3.11+, Node.js 20+, Docker & Docker Compose

### Installation

```bash
git clone https://github.com/Wikolabs/syntheticdata.git
cd syntheticdata

# Via Docker Compose — port 3040
docker compose up --build

# Accès : http://localhost:3040

# Backend seul
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend seul
cd frontend && npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

### Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| DATABASE_URL | PostgreSQL connection | postgresql://synth:synth@db:5432/syntheticdata |
| DATA_DIR | Répertoire de stockage des fichiers | /app/data |
| MAX_UPLOAD_MB | Taille max upload | 500 |
| DEFAULT_EPOCHS_CTGAN | Epochs CTGAN par défaut | 300 |
| DEFAULT_EPOCHS_TVAE | Epochs TVAE par défaut | 100 |

### Ports de la stack

| Service | Port interne | Port exposé |
|---|---|---|
| nginx | 80 | 3040 |
| frontend (Next.js) | 3000 | non exposé |
| backend (FastAPI) | 8000 | non exposé |
| PostgreSQL | 5432 | non exposé |

---

*Wikolabs — syntheticdata · Synthetic Tabular Data Generation as a Service · v1.0.0*
