import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { preferenceRouter } from './src/controllers/PreferenceController';
import { evaluationRouter } from './src/controllers/EvaluationController';
import { userRouter } from './src/controllers/UserController';
import { regionRouter } from './src/controllers/RegionController';
import { channelRouter } from './src/controllers/ChannelController';
import { policyRouter } from './src/controllers/PolicyController';

const app = express();
app.use(express.json());

const swaggerDocument = JSON.parse(readFileSync('./public/swagger.json', 'utf-8'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(preferenceRouter);
app.use(evaluationRouter);
app.use(userRouter);
app.use(regionRouter);
app.use(channelRouter);
app.use(policyRouter);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`
  Listening on port ${PORT}, 
  server on http://localhost:3001, 
  swagger http://localhost:3001/docs
  `));
