export type PickedLocation = { latitude: number; longitude: number };

export type MapLocationSelection = {
  value: PickedLocation | null;
  onChange: (point: PickedLocation) => void;
};
