import { app } from './index.js';
import { connectDB } from './db.js';
import { config } from './config.js';
connectDB()
    .then(() => {
    app.listen(config.port, () => {
        console.log(`[FoodBridge Server] Running on http://localhost:${config.port}`);
    });
})
    .catch(err => {
    console.error('[Server Bootstrap] Failed to start:', err);
});
