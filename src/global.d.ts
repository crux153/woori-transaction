declare interface Window {
  setToday(): void;
  setCalTerm(
    isBefore: boolean,
    baseId: string,
    targetId: string,
    unit: string,
    value: string
  ): void;
  doSubmit(): void;
}
