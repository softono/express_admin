export async function getIpInfo(ip: string = "") {
  try {
    const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json();

    return {
      ip: data.ip || "",
      city: data.city || "",
      region: data.region || "",
      country: data.country_name || data.country || "",
      countryCode: data.country_code || "",
      timezone: data.timezone || "",
      latitude: data.latitude || "",
      longitude: data.longitude || "",
      isp: data.org || "",
    };
  } catch {
    // console.error("getIpInfo error:", error);
    return null;
  }
}

// Get location string from IP
export async function getIpLocation(ip: string = ""): Promise<string> {
  try {
    const info = await getIpInfo(ip);

    if (!info) {
      return "Unknown";
    }

    const parts = [info.city, info.region, info.country].filter(Boolean);

    return parts.length ? parts.join(", ") : "Unknown";
  } catch {
    return "Unknown";
  }
}
