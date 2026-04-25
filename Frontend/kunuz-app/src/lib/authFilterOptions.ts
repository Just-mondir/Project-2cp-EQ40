type TranslateValues = Record<string, string | number>;
type Translator = (key: string, values?: TranslateValues) => string;

export const REGION_VALUES = [
  "Kabylia",
  "Tuareg",
  "Chaoui",
  "Chleuh",
  "Medea",
  "Constantine",
  "Algiers",
  "Tlemcen",
  "Oran",
  "Tipaza",
  "Setif",
  "Batna",
  "Beni Mzab",
  "Ouled Nail",
  "Tassili n'Ajjer",
] as const;

export const HISTORICAL_PERIOD_VALUES = [
  "Prehistory",
  "Protohistory",
  "Numidian period",
  "Punic (Carthaginian) period",
  "Roman period",
  "Vandal period",
  "Byzantine period",
  "Early Islamic period",
  "Rostamid dynasty",
  "Zirid dynasty",
  "Hammadid dynasty",
  "Almohad dynasty",
  "Zayyanid dynasty",
  "Ottoman period",
  "French colonization",
  "War of Independence",
  "Independent Algeria",
  "Contemporary period",
] as const;

export const MONUMENT_TYPE_VALUES = [
  "Civil",
  "Religious",
  "Military",
  "Funerary",
] as const;

export const EVENT_STATUS_VALUES = [
  "Upcoming",
  "Ongoing",
  "Past",
] as const;

export const URGENCY_LEVEL_VALUES = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;

export const MOBILIZATION_STATUS_VALUES = [
  "Restored",
  "Under intervention",
  "Destroyed",
  "Alert",
] as const;

export function translatePostType(value: string, tPostForm: Translator): string {
  switch (value.trim().toLowerCase()) {
    case "question":
      return tPostForm("options.postTypes.question");
    case "visit":
      return tPostForm("options.postTypes.visit");
    case "discovery":
      return tPostForm("options.postTypes.discovery");
    case "alert":
    case "in danger":
      return tPostForm("options.postTypes.inDanger");
    case "event":
      return tPostForm("options.postTypes.event");
    default:
      return value;
  }
}

export function translateRegion(value: string, tPostForm: Translator): string {
  switch (value) {
    case "Kabylia":
    case "Tuareg":
    case "Chaoui":
    case "Chleuh":
    case "Medea":
    case "Constantine":
    case "Algiers":
    case "Tlemcen":
    case "Oran":
    case "Tipaza":
    case "Setif":
    case "Batna":
    case "Beni Mzab":
    case "Ouled Nail":
    case "Tassili n'Ajjer":
      return tPostForm(`regions.${value}`);
    default:
      return value;
  }
}

export function translateHistoricalPeriod(value: string, tPostForm: Translator): string {
  switch (value) {
    case "Prehistory":
    case "Protohistory":
    case "Numidian period":
    case "Punic (Carthaginian) period":
    case "Roman period":
    case "Vandal period":
    case "Byzantine period":
    case "Early Islamic period":
    case "Rostamid dynasty":
    case "Zirid dynasty":
    case "Hammadid dynasty":
    case "Almohad dynasty":
    case "Zayyanid dynasty":
    case "Ottoman period":
    case "French colonization":
    case "War of Independence":
    case "Independent Algeria":
    case "Contemporary period":
      return tPostForm(`historicalPeriods.${value}`);
    default:
      return value;
  }
}

export function translateMonumentType(value: string, tPostForm: Translator): string {
  switch (value.trim().toLowerCase()) {
    case "civil":
      return tPostForm("options.monumentTypes.civil");
    case "military":
      return tPostForm("options.monumentTypes.military");
    case "religious":
      return tPostForm("options.monumentTypes.religious");
    case "funerary":
      return tPostForm("options.monumentTypes.funerary");
    default:
      return value;
  }
}

export function translateUrgencyLevel(value: string, tPostForm: Translator): string {
  switch (value.trim().toLowerCase()) {
    case "low":
      return tPostForm("options.dangerLevels.low");
    case "medium":
      return tPostForm("options.dangerLevels.medium");
    case "high":
      return tPostForm("options.dangerLevels.high");
    case "critical":
      return tPostForm("options.dangerLevels.critical");
    default:
      return value;
  }
}

export function translateMobilizationStatus(value: string, tPostForm: Translator): string {
  switch (value.trim().toLowerCase()) {
    case "restored":
      return tPostForm("options.statuses.restored");
    case "under intervention":
    case "under_intervention":
      return tPostForm("options.statuses.underIntervention");
    case "destroyed":
      return tPostForm("options.statuses.destroyed");
    case "alert":
      return tPostForm("options.statuses.alert");
    default:
      return value;
  }
}

export function translateEventStatus(value: string, tFilters: Translator): string {
  switch (value.trim().toLowerCase()) {
    case "upcoming":
      return tFilters("eventStatuses.upcoming");
    case "ongoing":
      return tFilters("eventStatuses.ongoing");
    case "past":
      return tFilters("eventStatuses.past");
    default:
      return value;
  }
}
