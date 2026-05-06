import express from 'express';
import cookieParser from "cookie-parser";
import { errorMiddleware } from '@packages/error-handler';
import adminRoutes from './routes/admin.routes';

const app = express();
app.use(express.json());
app.use(cookieParser());



app.get('/', (req, res) => {
  res.send({ message: 'Welcome to admin-service!' });
});

//routes
app.use('/api', adminRoutes);


app.use(errorMiddleware);

const port = process.env.PORT || 6005;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
