# TensorFlow.js Template

## Tech Stack
- @tensorflow/tfjs v4.x
- React 18+
- TypeScript 5+

## Core Patterns

### Model Loading
```typescript
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

const model = await mobilenet.load();

const img = document.getElementById('img') as HTMLImageElement;
const predictions = await model.classify(img);
console.log(predictions);
```

### Custom Model Training
```typescript
import * as tf from '@tensorflow/tfjs';

const model = tf.sequential();
model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

await model.fit(xs, ys, { epochs: 10 });

const prediction = model.predict(tf.tensor2d([5], [1, 1]));
```

### React Hook
```typescript
import { useEffect, useState } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';

export const useImageClassifier = () => {
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobilenet.load().then(m => {
      setModel(m);
      setLoading(false);
    });
  }, []);

  const classify = async (img: HTMLImageElement) => {
    if (!model) return null;
    return model.classify(img);
  };

  return { classify, loading };
};
```

## Common Commands

```bash
npm install @tensorflow/tfjs @tensorflow-models/mobilenet
npm run dev
```

## Related Resources
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [TF.js Models](https://www.tensorflow.org/js/models)
