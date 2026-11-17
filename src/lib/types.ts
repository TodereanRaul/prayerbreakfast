export type EventStatus = "confirmed" | "tbc" | "cancelled";
export type NationStatus = "in_progress" | "info_needed";

export interface PBEvent {
  id: string;
  title: string;
  short_name: string | null;
  city: string | null;
  country: string;
  country_code: string | null;
  venue: string | null;
  year: number;
  month: number | null;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;
  date_note: string | null;
  status: EventStatus;
  description: string | null;
  website_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_url: string | null;
  image_query: string | null;
  image_url: string | null;
  image_path: string | null;
  image_credit: string | null;
  image_source_url: string | null;
  published: boolean;
}

export interface Nation {
  id: string;
  country: string;
  country_code: string | null;
  status: NationStatus;
  note: string | null;
  sort_order: number;
}
