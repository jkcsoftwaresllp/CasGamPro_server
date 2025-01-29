import { GAME_STATES } from "../../services/shared/config/types.js";

export async function startGame() {
  this.status = GAME_STATES.BETTING;
  this.startTime = Date.now();
  await this.saveState();

  this.gameInterval = setTimeout(async () => {
    await this.startDealing();
  }, this.BETTING_PHASE_DURATION);

  //TODO: add `logger`

    // await this.processGameStateVideo();
}
