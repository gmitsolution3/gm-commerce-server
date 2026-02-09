import axios from "axios";
import { client } from "../config/db";
import { VisitorDoc } from "../types";

const visitorLog = client.db("loweCommerce").collection("VisitorLog");
const userLocation = client
  .db("loweCommerce")
  .collection<VisitorDoc>("UserLocation");

export async function VisitorLogCreate(data: {
  ip?: string | undefined;
  route?: string | undefined;
  timeSpent?: number | undefined;
  userAgent?: string | undefined;
  scrollDepth: Number | undefined;
  mouseMoves: Number | undefined;
  clicks: Number | undefined;
  touch: Number | undefined;
  screen:
    | {
        width: number;
        height: number;
        ratio: number;
        orientation: string;
      }
    | undefined;
}) {
  if (!data.ip || !data.route || !data.timeSpent) return null;

  const result = await visitorLog.updateOne(
    { ip: data.ip },
    {
      $set: {
        userAgent: data.userAgent,
        updatedAt: new Date(),
      },
      $push: {
        paths: {
          route: data.route,
          timeSpent: data.timeSpent,
          scrollDepth: data.scrollDepth,
          mouseMoves: data.mouseMoves,
          clicks: data.clicks,
          touch: data.touch,
          lastVisit: new Date(),
        } as any,
      },
      $setOnInsert: {
        ip: data.ip,
        screen: data.screen,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  return result;
}

export async function getLocationFromIP(ip: string) {
  try {
    const res = await axios.get(`https://ipapi.co/${ip}/json/`);
    return {
      country: res.data.country_name,
      city: res.data.city,
      region: res.data.region,
      lat: res.data.latitude,
      lng: res.data.longitude,
      isp: res.data.org,
    };
  } catch (err) {
    return null;
  }
}

const ifExistLocation = async (ip: string) => {
  const findLocation = await userLocation.findOne({ ip: ip });
  return findLocation;
};

export const UserLocationService = async (data: any) => {
  if (data.success && data.lat && data.lng) {
    const saved = await userLocation.updateOne(
      { ip: data.ip }, // find by ip
      {
        $set: {
          ip: data.ip,
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
          source: "GPS",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    return { from: "GEO_Location", location: saved };
  }

  const isExist = await ifExistLocation(data.ip);

  if (isExist) {
    return { from: "DB", location: isExist };
  }

  const locationFromAPI = await getLocationFromIP(data.ip);

  if (!locationFromAPI) {
    return { from: "API_FAILED", location: null };
  }

  const saved = await userLocation.updateOne(
    { ip: data.ip },
    {
      $set: {
        ip: data.ip,
        ...locationFromAPI,
        source: "IP",
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );

  return { from: "IP_API", location: saved };
};

export const addFraudUserDataService = async (payload: any) => {
  const { ip, ...rest } = payload;

  const result = await visitorLog.updateOne(
    { ip: ip },
    {
      $set: { fraud: rest, updatedAt: new Date() },
    },
    { upsert: true },
  );
};

export const addFraudScoreService = async (payload: any) => {
  const { ip, ...rest } = payload;

  const result = await visitorLog.updateOne(
    { ip: ip },
    {
      $set: {updatedAt: new Date() },
      $push: { "fraud.scores": rest },
    },
    { upsert: true },
  );

  return result;
};
