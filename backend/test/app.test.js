import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

function mockPublicClient(validToken = "ok-token") {
  return {
    auth: {
      async getUser(token) {
        if (token === validToken) return { data: { user: { id: "user-1" } }, error: null };
        return { data: { user: null }, error: new Error("invalid") };
      }
    }
  };
}

function mockRepo() {
  const store = [];
  return {
    async create(ownerId, input) {
      const row = { id: String(store.length + 1), owner_id: ownerId, created_at: new Date().toISOString(), ...input };
      store.unshift(row);
      return row;
    },
    async list(query) {
      return store.filter((p) => {
        const s = (query.search ?? "").toLowerCase();
        if (s && !(`${p.title} ${p.description}`.toLowerCase().includes(s))) return false;
        if (query.city && !p.city.toLowerCase().includes(String(query.city).toLowerCase())) return false;
        if (query.minPrice && p.price < Number(query.minPrice)) return false;
        if (query.maxPrice && p.price > Number(query.maxPrice)) return false;
        return true;
      });
    },
    async getById(id) {
      const found = store.find((p) => p.id === id);
      if (!found) throw new Error("no rows");
      return found;
    }
  };
}

describe("property api", () => {
  it("creates, lists, searches, and gets details", async () => {
    const app = createApp({ publicClient: mockPublicClient(), adminClient: {}, propertyRepository: mockRepo() });

    const payload = {
      title: "Demo Villa",
      description: "Beautiful family villa close to metro.",
      city: "Bangalore",
      address: "Indiranagar",
      price: 5500000,
      bedrooms: 3,
      bathrooms: 2,
      area_sqft: 1400,
      image_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"
    };

    const created = await request(app)
      .post("/api/properties")
      .set("Authorization", "Bearer ok-token")
      .send(payload)
      .expect(201);

    expect(created.body.data.title).toBe("Demo Villa");

    const list = await request(app).get("/api/properties?search=villa").expect(200);
    expect(list.body.data).toHaveLength(1);

    const detail = await request(app).get(`/api/properties/${created.body.data.id}`).expect(200);
    expect(detail.body.data.city).toBe("Bangalore");
  });

  it("rejects unauthenticated create", async () => {
    const app = createApp({ publicClient: mockPublicClient(), adminClient: {}, propertyRepository: mockRepo() });
    await request(app).post("/api/properties").send({}).expect(401);
  });
});