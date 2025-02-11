export async function processGameStateVideo() {
  if (this.videoState.processing) {
    return;
  }

  try {
    this.videoState.processing = true;

    const gameState = {
      gameType: this.constructor.name,
      roundId: this.roundId,
      status: this.status,
      cards: {
        jokerCard: this.jokerCard || null,
        blindCard: this.blindCard || null,
        playerA: this.collectCards("A") || [],
        playerB: this.collectCards("B") || [],
        playerC: this.collectCards("C") || [],
      },
      winner: this.winner,
      startTime: this.startTime,
    };

    const outputPath = `/tmp/game_videos/${this.gameType}.mp4`;

    await this.videoProcessor.processVideo({
      gameState,
      output_path: outputPath,
      onProgress: (progress) => {
        this.videoState.progress = progress;
        this.broadcastVideoProgress();
      },
    });

    this.videoState.outputPath = outputPath;
    this.videoState.processing = false;
    this.broadcastVideoComplete();
  } catch (error) {
    this.videoState.processing = false;
    //logger.error(`Video processing error for game ${this.roundId}:`, error);
    // throw error;
  }
}
export function broadcastVideoProgress() {
  const io = global.io?.of("/game");
  if (io) {
    io.to(`game:${this.roundId}`).emit("videoProgress", {
      roundId: this.roundId,
      progress: this.videoState.progress,
    });
  }
}

export function broadcastVideoComplete() {
  const io = global.io?.of("/game");
  if (io) {
    io.to(`game:${this.roundId}`).emit("videoComplete", {
      roundId: this.roundId,
      outputPath: this.videoState.outputPath,
    });
  }
}
