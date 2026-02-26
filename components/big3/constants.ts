/** WheelPicker options for Big3 create/edit forms */

export const BIG3_WEIGHT_OPTIONS = Array.from({ length: 121 }, (_, i) => {
  const val = i * 2.5;
  return { value: String(val), label: `${val}kg` };
});

export const BIG3_REPS_OPTIONS = [
  { value: '', label: '-' },
  ...Array.from({ length: 30 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}회`,
  })),
];

export const BIG3_RPE_OPTIONS = [
  { value: '', label: '-' },
  ...Array.from({ length: 19 }, (_, i) => {
    const val = 1 + i * 0.5;
    return { value: String(val), label: String(val) };
  }),
];
