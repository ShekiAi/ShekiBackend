// middleware/requireServiceKey.ts
//
// GOYE's own backend calls ShekiAI's course-draft API server-to-server
// (confirmed architecture: GOYE calls the API, ShekiAI). Since GOYE already
// verifies the tutor's identity via its own auth before making this call,
// ShekiAI doesn't need to independently verify a per-tutor JWT here — it
// needs to verify the CALLER is actually GOYE's backend, not an arbitrary
// public request supplying any tutorId it likes. A shared service key does
// that with far less complexity than bridging two separate JWT schemes.
import { NextFunction, Request, Response } from "express";

export function requireServiceKey(req: Request, res: Response, next: NextFunction) {
  const provided = req.headers["x-service-key"];
  const expected = process.env.SHEKIAI_SERVICE_KEY;

  if (!expected) {
    console.error("SHEKIAI_SERVICE_KEY is not configured — refusing all course-draft requests.");
    return res.status(500).json({ message: "Server misconfigured", data: [], status: 500, error: ["SHEKIAI_SERVICE_KEY not set"] });
  }

  if (provided !== expected) {
    return res.status(401).json({ message: "Invalid or missing service key", data: [], status: 401, error: ["unauthorized"] });
  }

  next();
}
