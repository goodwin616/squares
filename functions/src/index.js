"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start_game = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app"); // New import style
const firestore_1 = require("firebase-admin/firestore"); // New import style
const crypto_1 = require("crypto");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
/**
 * Cryptographically Secure Fisher-Yates Shuffle
 * Uses Node.js crypto.randomInt to guarantee uniform distribution without bias.
 */
function secureShuffle(array) {
    // Clone the array to avoid mutating the input directly
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        // randomInt(min, max) is exclusive of max.
        // We need a random index between 0 and i (inclusive), so we pass i + 1.
        const j = (0, crypto_1.randomInt)(0, i + 1);
        // Swap elements
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
exports.start_game = (0, https_1.onCall)(async (request) => {
    const gameId = request.data.gameId;
    // 0. Basic Validation
    if (!gameId) {
        throw new https_1.HttpsError("invalid-argument", "The function must be called with a gameId.");
    }
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const gameRef = db.collection("games").doc(gameId);
    const gameSnap = await gameRef.get();
    if (!gameSnap.exists) {
        throw new https_1.HttpsError("not-found", "Game not found.");
    }
    const gameData = gameSnap.data();
    // 1. Authorization: Only admin can start
    if (gameData.admin_id !== request.auth.uid) {
        throw new https_1.HttpsError("permission-denied", "Only the game admin can start the game.");
    }
    // 2. Status Check
    if (gameData.status !== "DRAFT") {
        throw new https_1.HttpsError("failed-precondition", "Game is already started or completed.");
    }
    // 3. Rule Check: Unclaimed Squares
    const unclaimedRule = gameData.config?.rules?.unclaimed_rule || "RETURN_TO_POOL";
    if (unclaimedRule === "REQUIRE_FULL") {
        const squaresRef = gameRef.collection("squares");
        const countSnapshot = await squaresRef.count().get();
        const count = countSnapshot.data().count;
        if (count < 100) {
            throw new https_1.HttpsError("failed-precondition", `Grid not full. Only ${count}/100 squares taken.`);
        }
    }
    // 4. Randomization (Secure)
    const rowNums = secureShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const colNums = secureShuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // 5. Execution
    await gameRef.update({
        status: "LOCKED",
        grid_numbers: {
            row: rowNums,
            col: colNums
        },
        started_at: firestore_1.FieldValue.serverTimestamp()
    });
    return { success: true, message: "Game started successfully" };
});
//# sourceMappingURL=index.js.map