import * as tf from "@tensorflow/tfjs-node";
import { getUserActivity } from "./fetchUser-activity";
import { preProcessData } from "../utils/preProcessData";


const EMBEDDING_DIM = 50;

interface UserAction {
  userId: string;
  productId: string;
  actionType: "product_view" | "add_to_cart" | "add_to_wishlist" | "purchase";
}

interface Interaction {
  userId: string;
  productId: string;
  actionType: UserAction["actionType"];
}

interface RecommendedProduct {
  productId: string;
  score: number;
}

async function fetchUserActivity(userId: string): Promise<UserAction[]> {
  const userActions = await getUserActivity(userId);
  return Array.isArray(userActions) ? (userActions as unknown as UserAction[]) : [];
}

export const recommendedProducts = async (userId: string, allProducts: any): Promise<string[]> => {
  const userActions: UserAction[] = await fetchUserActivity(userId);

  if (userActions.length === 0) {
    return [];
  }

  const processedData = preProcessData(userActions, allProducts);
  if (!processedData || !processedData.interactions || !processedData.products) {
    return [];
  }

  const { interactions } = processedData as {
    interactions: Interaction[],
  }

  const userMap: Record<string, number> = {}

  const productMap: Record<string, number> = {}
  let userCount = 0;
  let productCount = 0;

  interactions.forEach(({ userId, productId }) => {
    if (!(userId in userMap)) userMap[userId] = userCount++;
    if (!(productId in productMap)) productMap[productId] = productCount++;
  });

  //define our model input layers
  const userInput = tf.input({
    shape: [1],
    dtype: "int32",
  }) as tf.SymbolicTensor;

  const productInput = tf.input({
    shape: [1],
    dtype: "int32",
  }) as tf.SymbolicTensor;


  //create embedding layer like lookup tables to learn the relationship
  const userEmbedding = tf.layers.embedding({ inputDim: userCount, outputDim: EMBEDDING_DIM }).apply(userInput) as tf.SymbolicTensor;
  const productEmbedding = tf.layers.embedding({ inputDim: productCount, outputDim: EMBEDDING_DIM }).apply(productInput) as tf.SymbolicTensor;

  //Flatening the two embeddings into 1D feature vector
  const userVector = tf.layers.flatten().apply(userEmbedding) as tf.SymbolicTensor;
  const productVector = tf.layers.flatten().apply(productEmbedding) as tf.SymbolicTensor;



  //concatenating the two feature vectors
  const merged = tf.layers.dot({ axes: 1 }).apply([userVector, productVector]) as tf.SymbolicTensor;

  //Final layer:ouput the probability of the interactions
  const output = tf.layers.dense({ units: 1, activation: "sigmoid" }).apply(merged) as tf.SymbolicTensor;

  //create the model
  const model = tf.model({ inputs: [userInput, productInput], outputs: output });

  //compile the model
  const model = tf.model({
    inputs: [userInput, productInput],
    outputs: output,
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  //convert user and product interactions for training
  const userTensor = tf.tensor1d(interactions.map((d) => userMap[d.userId] ?? 0), "int32");
  const productTensor = tf.tensor1d(interactions.map((d) => productMap[d.productId] ?? 0), "int32");

  const weightLabels = tf.tensor2d(interactions.map((d) => {
    switch (d.actionType) {
      case "product_view":
        return 1;
      case "add_to_cart":
        return 2;
      case "add_to_wishlist":
        return 3;
      case "purchase":
        return 4;
      default:
        return 0;
    }
  }), [interactions.length, 1]);

  await model.fit([userTensor, productTensor], weightLabels, {
    epochs: 10,
    batchSize: 32,
    validationSplit: 0.2,
  });

  const productTensorAll = tf.tensor1d(Object.values(productMap), "int32");

  const userTensorAll = tf.tensor1d(Object.values(userMap), "int32");

  const predictions = model.predict([tf.tensor1d([userMap[userId] ?? 0], "int32"), productTensorAll]) as tf.Tensor;

  const scores = (await predictions.array()) as number[];

  //sort and select best recommended products
  const recommendedProducts: RecommendedProduct[] = Object.keys(productMap).map((productId, index) => ({
    productId,
    score: scores[index] ?? 0,
  })).sort((a, b) => b.score - a.score).slice(0, 10);


  return recommendedProducts.map((d) => d.productId);
};