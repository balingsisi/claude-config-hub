# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project Name**: Machine Learning Pipeline Service
**Type**: ML Training & Inference Platform
**Tech Stack**: Python 3.11+ + FastAPI + PyTorch/TensorFlow
**Goal**: Production-ready ML service with training, inference, and monitoring capabilities

---

## Tech Stack

### Core ML
- **Framework**: PyTorch 2.0+ / TensorFlow 2.14+ / scikit-learn
- **Language**: Python 3.11+
- **API**: FastAPI 0.109+ / Flask
- **Validation**: Pydantic 2.5+

### Data Processing
- **Data Manipulation**: Pandas 2.0+ / NumPy 1.26+
- **Feature Store**: Feast / Tecton
- **Data Versioning**: DVC / Delta Lake
- **ETL**: Apache Airflow / Prefect

### Model Management
- **Experiment Tracking**: MLflow / Weights & Biases
- **Model Registry**: MLflow Model Registry
- **Model Serving**: TorchServe / TensorFlow Serving / Triton
- **Containerization**: Docker + Kubernetes

### Infrastructure
- **Compute**: AWS SageMaker / GCP Vertex AI / Azure ML
- **Storage**: S3 / GCS / Azure Blob
- **Database**: PostgreSQL (metadata) + Redis (cache)
- **Queue**: Celery + Redis / AWS SQS

---

## Code Standards

### Python Rules
- Use type hints for all functions
- Follow PEP 8 style guide
- Use dataclasses or Pydantic models for data structures
- Implement proper logging and error handling

```python
# ✅ Good - Type-safe model with proper validation
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
import numpy as np

class ModelInput(BaseModel):
    features: List[float] = Field(..., min_items=10, max_items=10)
    model_version: Optional[str] = Field(None, pattern=r"^v\d+\.\d+\.\d+$")
    
    @validator('features')
    def validate_features(cls, v):
        if not all(isinstance(x, (int, float)) for x in v):
            raise ValueError('All features must be numeric')
        return v

class PredictionResult(BaseModel):
    prediction: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    model_version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

async def predict(input_data: ModelInput) -> PredictionResult:
    """
    Make prediction using trained model.
    
    Args:
        input_data: Validated input features
        
    Returns:
        PredictionResult with confidence score
        
    Raises:
        ModelNotFoundError: If model version not found
        PredictionError: If prediction fails
    """
    model = await load_model(input_data.model_version)
    features = np.array(input_data.features).reshape(1, -1)
    
    prediction = model.predict(features)[0]
    confidence = model.predict_proba(features)[0].max()
    
    return PredictionResult(
        prediction=prediction,
        confidence=confidence,
        model_version=input_data.model_version or "latest"
    )

# ❌ Bad - No validation, no types, no error handling
def predict(features):
    model = load_model()  # ❌ No error handling
    return model.predict([features])[0]  # ❌ No validation
```

### Naming Conventions
- **Files**: snake_case (`model_trainer.py`, `data_processor.py`)
- **Classes**: PascalCase (`ModelTrainer`, `DataProcessor`)
- **Functions**: snake_case (`train_model`, `process_data`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_EPOCHS`, `LEARNING_RATE`)
- **Models**: PascalCase with suffix (`UserEmbeddingModel`, `SentimentClassifier`)

### File Organization
```
ml-service/
├── src/
│   ├── api/                    # FastAPI endpoints
│   │   ├── routes/
│   │   │   ├── predict.py
│   │   │   └── train.py
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── models/                 # Model definitions
│   │   ├── base.py
│   │   ├── classification/
│   │   │   └── sentiment.py
│   │   └── regression/
│   │       └── price_predictor.py
│   ├── training/               # Training pipeline
│   │   ├── trainer.py
│   │   ├── evaluator.py
│   │   └── hyperparameter_tuning.py
│   ├── data/                   # Data processing
│   │   ├── dataset.py
│   │   ├── preprocessing.py
│   │   └── feature_engineering.py
│   ├── inference/              # Inference logic
│   │   ├── predictor.py
│   │   └── batch_predictor.py
│   └── utils/                  # Utilities
│       ├── logger.py
│       ├── metrics.py
│       └── config.py
├── tests/                      # Test files
│   ├── test_api.py
│   ├── test_training.py
│   └── test_inference.py
├── configs/                    # Configuration files
│   ├── model_config.yaml
│   ├── training_config.yaml
│   └── inference_config.yaml
├── scripts/                    # Utility scripts
│   ├── train_model.py
│   └── evaluate_model.py
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

---

## Architecture Patterns

### Model Training Pattern

**When to use**: Structured training workflow with experiment tracking

```python
# ✅ Good - Structured training with MLflow tracking
import mlflow
from typing import Dict, Any
from pathlib import Path

class ModelTrainer:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.model = None
        mlflow.set_tracking_uri(config["mlflow_uri"])
        
    def train(self, train_data, val_data) -> Dict[str, float]:
        """Train model with experiment tracking."""
        with mlflow.start_run():
            # Log hyperparameters
            mlflow.log_params(self.config["hyperparameters"])
            
            # Initialize model
            self.model = self._create_model()
            
            # Training loop
            for epoch in range(self.config["epochs"]):
                train_loss = self._train_epoch(train_data)
                val_loss, val_metrics = self._validate(val_data)
                
                # Log metrics
                mlflow.log_metrics({
                    "train_loss": train_loss,
                    "val_loss": val_loss,
                    **val_metrics
                }, step=epoch)
                
                # Early stopping
                if self._should_stop(val_loss):
                    break
            
            # Log model
            mlflow.pytorch.log_model(self.model, "model")
            
            return {
                "final_train_loss": train_loss,
                "final_val_loss": val_loss,
                **val_metrics
            }
    
    def _create_model(self):
        """Create model instance."""
        # Implementation
        pass
    
    def _train_epoch(self, train_data):
        """Train for one epoch."""
        # Implementation
        pass
    
    def _validate(self, val_data):
        """Validate model."""
        # Implementation
        pass
    
    def _should_stop(self, val_loss):
        """Check early stopping criteria."""
        # Implementation
        pass
```

### Feature Engineering Pattern

**When to use**: Consistent feature transformation across training and inference

```python
# ✅ Good - Reusable feature pipeline
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
import pandas as pd

class FeatureEngineer:
    def __init__(self):
        self.pipeline = None
        
    def fit(self, df: pd.DataFrame) -> 'FeatureEngineer':
        """Fit feature engineering pipeline."""
        numeric_features = df.select_dtypes(include=['int64', 'float64']).columns
        categorical_features = df.select_dtypes(include=['object']).columns
        
        numeric_transformer = Pipeline(steps=[
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(drop='first', sparse_output=False))
        ])
        
        self.pipeline = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ]
        )
        
        self.pipeline.fit(df)
        return self
    
    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transform data using fitted pipeline."""
        if self.pipeline is None:
            raise ValueError("Pipeline not fitted. Call fit() first.")
        return self.pipeline.transform(df)
    
    def save(self, path: Path):
        """Save pipeline to disk."""
        joblib.dump(self.pipeline, path)
    
    @classmethod
    def load(cls, path: Path) -> 'FeatureEngineer':
        """Load pipeline from disk."""
        engineer = cls()
        engineer.pipeline = joblib.load(path)
        return engineer
```

### Model Serving Pattern

**When to use**: Production model inference API

```python
# ✅ Good - FastAPI with model caching and batching
from fastapi import FastAPI, HTTPException
from functools import lru_cache
import asyncio
from typing import List

app = FastAPI()

class ModelCache:
    def __init__(self):
        self.models = {}
    
    async def get_model(self, version: str):
        """Load model with caching."""
        if version not in self.models:
            self.models[version] = await self._load_model(version)
        return self.models[version]
    
    async def _load_model(self, version: str):
        """Load model from storage."""
        # Implementation
        pass

model_cache = ModelCache()

@app.post("/predict", response_model=PredictionResult)
async def predict_single(input_data: ModelInput):
    """Single prediction endpoint."""
    try:
        model = await model_cache.get_model(input_data.model_version or "latest")
        result = await predict(input_data)
        return result
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/batch", response_model=List[PredictionResult])
async def predict_batch(inputs: List[ModelInput]):
    """Batch prediction endpoint."""
    try:
        results = await asyncio.gather(*[
            predict(input_data) for input_data in inputs
        ])
        return results
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Key Constraints

### Model Quality
- ✅ Track all experiments with MLflow
- ✅ Implement proper train/val/test splits
- ✅ Use cross-validation for small datasets
- ✅ Monitor for data drift
- ✅ Version control datasets with DVC
- ❌ No training on test data
- ❌ No data leakage between splits
- ❌ No deploying untested models

### Performance
- ✅ Optimize inference latency
- ✅ Implement model caching
- ✅ Use batching for high throughput
- ✅ Profile and optimize bottlenecks
- ❌ No loading model on every request
- ❌ No synchronous training in API
- ❌ No unbounded batch sizes

### Reproducibility
- ✅ Set random seeds
- ✅ Log all hyperparameters
- ✅ Version control code and data
- ✅ Document model architecture
- ❌ No undocumented preprocessing steps
- ❌ No hardcoded paths
- ❌ No missing dependency versions

---

## Common Commands

### Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run API server
uvicorn src.api.main:app --reload --port 8000

# Run training script
python scripts/train_model.py --config configs/training_config.yaml

# Evaluate model
python scripts/evaluate_model.py --model-path models/model_v1.pkl

# Run tests
pytest tests/ -v --cov=src

# Format code
black src/ tests/
isort src/ tests/
```

### MLflow
```bash
# Start MLflow UI
mlflow ui --backend-store-uri sqlite:///mlflow.db

# Run experiment
mlflow run . -P param1=value1

# Serve model
mlflow models serve -m "models:/model_name/Production" -p 5001
```

### Docker
```bash
# Build image
docker build -t ml-service:v1.0 .

# Run container
docker run -p 8000:8000 ml-service:v1.0

# Run with GPU
docker run --gpus all -p 8000:8000 ml-service:v1.0
```

### Model Management
```bash
# Register model
mlflow.register_model("runs:/<run-id>/model", "model_name")

# Transition model stage
mlflow.transition_model_version_stage(
    name="model_name",
    version=1,
    stage="Production"
)

# Archive old model
mlflow.transition_model_version_stage(
    name="model_name",
    version=0,
    stage="Archived"
)
```

---

## Important Prohibitions

### ❌ Never Do
- Don't commit large datasets to Git
- Don't use `pickle` for untrusted data
- Don't train on production data without validation
- Don't skip model versioning
- Don't ignore data drift
- Don't deploy models without monitoring
- Don't use global random state

### ⚠️ Use with Caution
- Pre-trained models - verify license and bias
- AutoML - may not find optimal solution
- Transfer learning - ensure domain compatibility
- Ensemble methods - consider inference cost
- Deep learning - profile resource usage

---

## Best Practices

### Data Validation

```python
# ✅ Good - Comprehensive data validation
from pydantic import BaseModel, validator
import pandas as pd

class TrainingData(BaseModel):
    features: pd.DataFrame
    labels: pd.Series
    
    @validator('features')
    def validate_features(cls, v):
        if v.isnull().any().any():
            raise ValueError('Features contain null values')
        if v.shape[0] == 0:
            raise ValueError('Features dataframe is empty')
        return v
    
    @validator('labels')
    def validate_labels(cls, v, values):
        if 'features' not in values:
            return v
        if len(v) != len(values['features']):
            raise ValueError('Features and labels have different lengths')
        return v
    
    class Config:
        arbitrary_types_allowed = True
```

### Model Monitoring

```python
# ✅ Good - Production model monitoring
from prometheus_client import Counter, Histogram, Gauge
import numpy as np

# Metrics
prediction_counter = Counter('predictions_total', 'Total predictions')
prediction_latency = Histogram('prediction_latency_seconds', 'Prediction latency')
prediction_confidence = Histogram('prediction_confidence', 'Prediction confidence')
data_drift_gauge = Gauge('data_drift_score', 'Data drift score')

async def predict_with_monitoring(input_data: ModelInput) -> PredictionResult:
    """Predict with monitoring metrics."""
    with prediction_latency.time():
        result = await predict(input_data)
    
    prediction_counter.inc()
    prediction_confidence.observe(result.confidence)
    
    # Check for data drift
    drift_score = calculate_drift_score(input_data.features)
    data_drift_gauge.set(drift_score)
    
    if drift_score > 0.3:
        logger.warning(f"High data drift detected: {drift_score}")
    
    return result

def calculate_drift_score(features: List[float]) -> float:
    """Calculate drift score using statistical tests."""
    # Implementation
    pass
```

### A/B Testing

```python
# ✅ Good - A/B testing framework
import hashlib
from typing import Literal

class ABTestingFramework:
    def __init__(self, model_a_version: str, model_b_version: str, split_ratio: float = 0.5):
        self.model_a_version = model_a_version
        self.model_b_version = model_b_version
        self.split_ratio = split_ratio
    
    def get_model_version(self, user_id: str) -> Literal["A", "B"]:
        """Determine which model version to use."""
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        normalized = (hash_value % 10000) / 10000.0
        
        if normalized < self.split_ratio:
            return self.model_a_version
        else:
            return self.model_b_version

async def predict_with_ab_test(
    user_id: str,
    input_data: ModelInput,
    ab_framework: ABTestingFramework
) -> PredictionResult:
    """Predict using A/B testing."""
    model_version = ab_framework.get_model_version(user_id)
    input_data.model_version = model_version
    
    result = await predict(input_data)
    result.ab_test_group = "A" if model_version == ab_framework.model_a_version else "B"
    
    return result
```

---

## Quick Reference

### Model Lifecycle
```python
# 1. Training
trainer = ModelTrainer(config)
metrics = trainer.train(train_data, val_data)

# 2. Evaluation
evaluator = ModelEvaluator()
test_metrics = evaluator.evaluate(model, test_data)

# 3. Registration
mlflow.register_model("runs:/run-id/model", "model_name")

# 4. Deployment
# Deploy to serving infrastructure

# 5. Monitoring
# Track predictions, drift, and performance
```

### Common Metrics
- **Classification**: Accuracy, Precision, Recall, F1, ROC-AUC
- **Regression**: MAE, MSE, RMSE, R²
- **Ranking**: NDCG, MRR, MAP
- **Clustering**: Silhouette Score, Davies-Bouldin Index

### Hyperparameter Tuning
```python
from optuna import create_study

def objective(trial):
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    batch_size = trial.suggest_categorical('batch_size', [32, 64, 128])
    epochs = trial.suggest_int('epochs', 10, 100)
    
    # Train and evaluate
    metrics = train_and_evaluate(lr, batch_size, epochs)
    return metrics['val_loss']

study = create_study(direction='minimize')
study.optimize(objective, n_trials=100)
```

### Data Pipeline
```python
# ETL Pipeline
raw_data = load_raw_data()
cleaned_data = clean_data(raw_data)
features = engineer_features(cleaned_data)
train_data, val_data, test_data = split_data(features)

# Feature Store
feature_store = FeatureStore()
feature_store.write_features(train_features, entity_keys)
```

---

**Last Updated**: 2026-03-13
