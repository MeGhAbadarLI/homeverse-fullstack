import { z } from "zod";

const propertyInputSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(1500),
  city: z.string().min(2).max(80),
  address: z.string().min(5).max(200),
  price: z.coerce.number().positive(),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().int().min(0).max(20),
  area_sqft: z.coerce.number().int().min(100).max(100000),
  image_url: z.string().url()
});

const searchQuerySchema = z.object({
  search: z.string().optional().default(""),
  city: z.string().optional().default(""),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional()
});

export class PropertyRepository {
  constructor(adminClient) {
    this.adminClient = adminClient;
  }

  async create(ownerId, input) {
    const data = propertyInputSchema.parse(input);
    const { data: row, error } = await this.adminClient
      .from("properties")
      .insert({ ...data, owner_id: ownerId })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return row;
  }

  async list(query) {
    const parsed = searchQuerySchema.parse(query);
    let q = this.adminClient.from("properties").select("*").order("created_at", { ascending: false });

    if (parsed.city) q = q.ilike("city", `%${parsed.city}%`);
    if (parsed.minPrice !== undefined) q = q.gte("price", parsed.minPrice);
    if (parsed.maxPrice !== undefined) q = q.lte("price", parsed.maxPrice);
    if (parsed.search) {
      q = q.or(`title.ilike.%${parsed.search}%,description.ilike.%${parsed.search}%`);
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data;
  }

  async getById(id) {
    const { data, error } = await this.adminClient.from("properties").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  }
}

export function validatePropertyInput(input) {
  return propertyInputSchema.parse(input);
}