// React Native uyumlu EventEmitter kullan
class SimpleEventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }

  off(event: string, listener: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }

  setMaxListeners(_n: number) {
    // React Native'de gerekli değil, sadece uyumluluk için
  }
}

// Global olay yayınlayıcı
export const eventEmitter = new SimpleEventEmitter();

// Mevcut Node.js davranışını değiştir, dinleyici sınırını arttır
eventEmitter.setMaxListeners(20);

// Kullanılabilir olaylar
export const Events = {
  USER_DATA_UPDATED: 'userDataUpdated',
}; 