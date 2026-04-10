import DodoPayments from "dodopayments";

let _client: DodoPayments | null = null;

export function dodo(): DodoPayments {
  if (!_client) {
    _client = new DodoPayments({
      bearerToken: process.env.DODO_API_KEY!,
      environment:
        process.env.NODE_ENV === "production" ? "live_mode" : "test_mode",
    });
  }
  return _client;
}
