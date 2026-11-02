// Cliente REST mínimo para la API de Strapi 5.
// Responsabilidad única: comunicación HTTP con Strapi (auth, request, errores).

/**
 * Crea un cliente para interactuar con la REST API de Strapi 5.
 * @param {{ baseUrl: string, token?: string }} options
 */
export function createStrapiClient({ baseUrl, token }) {
  const apiUrl = `${baseUrl.replace(/\/$/, "")}/api`;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  /**
   * Realiza una petición y valida la respuesta.
   * @param {string} path  Ruta relativa a /api (ej. "/categories")
   * @param {RequestInit} init
   */
  async function request(path, init = {}) {
    const url = `${apiUrl}${path}`;
    let response;
    try {
      response = await fetch(url, { ...init, headers });
    } catch (cause) {
      throw new Error(
        `No se pudo conectar con Strapi en ${url}. ¿Está el servidor en marcha? (${cause.message})`,
        { cause }
      );
    }

    const text = await response.text();
    const body = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      const detail = body?.error?.message || response.statusText;
      throw new Error(
        `Strapi respondió ${response.status} en ${init.method ?? "GET"} ${path}: ${detail}`
      );
    }

    return body;
  }

  return {
    /**
     * Busca una entrada por un campo exacto (ej. slug). Devuelve el primer match o null.
     * @param {{ resource: string, field: string, value: string }} params
     */
    async findOneByField({ resource, field, value }) {
      const query = new URLSearchParams();
      query.set(`filters[${field}][$eq]`, value);
      query.set("pagination[pageSize]", "1");
      const data = await request(`/${resource}?${query.toString()}`);
      const first = Array.isArray(data?.data) ? data.data[0] : null;
      return first ?? null;
    },

    /**
     * Crea una entrada en una colección.
     * @param {{ resource: string, data: Record<string, unknown> }} params
     */
    async create({ resource, data }) {
      const body = await request(`/${resource}`, {
        method: "POST",
        body: JSON.stringify({ data }),
      });
      return body?.data ?? null;
    },

    /**
     * Actualiza una entrada existente por su documentId.
     * @param {{ resource: string, documentId: string, data: Record<string, unknown> }} params
     */
    async update({ resource, documentId, data }) {
      const body = await request(`/${resource}/${documentId}`, {
        method: "PUT",
        body: JSON.stringify({ data }),
      });
      return body?.data ?? null;
    },
  };
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
