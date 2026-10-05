import "server-only";

export type AdultPasswordResetMessage = {
  recipient: string;
  token: string;
  expiresAt: Date;
};

export interface AdultPasswordResetDelivery {
  send(message: AdultPasswordResetMessage): Promise<void>;
}

export const unavailableAdultPasswordResetDelivery: AdultPasswordResetDelivery = {
  async send() {
    throw new Error("[auth] provedor de e-mail para recuperação ainda não configurado.");
  },
};
