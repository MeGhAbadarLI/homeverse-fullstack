import express from "express";
import cors from "cors";
import { ZodError } from "zod";
import { PropertyRepository } from "./properties.js";
import { createAuthMiddleware } from "./auth.js";

export function createApp({ publicClient, adminClient, corsOrigin = "*", propertyRepository }) {
  const app = express();
  const repo = propertyRepository ?? new PropertyRepository(adminClient);
  const requireAuth = createAuthMiddleware(publicClient);

  app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin.split(","), credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/properties", async (req, res, next) => {
    try {
      const properties = await repo.list(req.query);
      res.json({ data: properties });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/properties/:id", async (req, res, next) => {
    try {
      const property = await repo.getById(req.params.id);
      res.json({ data: property });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/properties", requireAuth, async (req, res, next) => {
    try {
      const property = await repo.create(req.user.id, req.body);
      res.status(201).json({ data: property });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }

    if (typeof error.message === "string" && error.message.toLowerCase().includes("no rows")) {
      return res.status(404).json({ error: "Property not found" });
    }

    return res.status(500).json({ error: error.message || "Internal server error" });
  });

  return app;
}