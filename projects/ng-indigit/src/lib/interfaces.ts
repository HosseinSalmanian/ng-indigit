export type DigitGroupDelimiter = ',' | ' ' | '-' | '`';

export type IndicatorPosition
  = 'afterDecimalSeparator' | 'beforePreviousDecimalPart' | 'afterLastUserModification' | number;

export type CustomDecimalSeparator = '/' | ',';

export type DecimalSeparator = CustomDecimalSeparator | '.';

export interface IndexPositioningParam {
  preDeleteVal: string;
  postDeleteVal: string;
  preDeleteIndex: number;
  delimiter: DigitGroupDelimiter;
  decimalSeparator: DecimalSeparator;
}

export interface DigitGroupingDelimiterPositionsParam {
  subject: string;
  delimiter: DigitGroupDelimiter;
  maxDigits: number;
}

export interface DecimalParameters {
  decimalSeparator?: CustomDecimalSeparator;
  maxDecimalDigits?: number;
  minDecimalDigits?: number;
}

export interface DetailedDigitGroupingParameters {
  delimiter?: DigitGroupDelimiter;
  groupSize?: number;
}

export interface DigitGroupingParameters extends DetailedDigitGroupingParameters {
  decimalDigitGroups?: boolean | DetailedDigitGroupingParameters;
  integerDigitGroups?: boolean | DetailedDigitGroupingParameters;
}

