import DodoPayments from "dodopayments";

let _client: DodoPayments | null = null;

export function dodo(): DodoPayments {
  if (!_client) {
    console.log("Dodo init:", {
      hasKey: !!process.env.DODO_API_KEY,
      keyPrefix: process.env.DODO_API_KEY?.slice(0, 8),
      nodeEnv: process.env.NODE_ENV,
    });
    _client = new DodoPayments({
      bearerToken: process.env.DODO_API_KEY!,
      environment: "live_mode",
    });
  }
  return _client;
}
