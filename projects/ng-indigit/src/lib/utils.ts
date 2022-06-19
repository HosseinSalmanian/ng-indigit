import { DecimalSeparator, IndexPositioningParam, DigitGroupingDelimiterPositionsParam, DigitGroupingParameters } from './interfaces';

export function isDigitGroupingParameter(value: any): value is DigitGroupingParameters {
  return ['delimiter', 'groupSize', 'decimalDigitGroups', 'integerDigitGroups'].some(key => key in value);
}

const deduplicateDecimalSeparator: (subject: string, decimalSeparator: DecimalSeparator) => string
  = (subject, decimalSeparator) => {
  if (!subject)
    return '';
  const i = subject.indexOf(decimalSeparator);
  if (i === subject.lastIndexOf(decimalSeparator))
    return subject;
  return (subject.substring(0, i) + decimalSeparator + subject.substring(i + 1).replace(RegExp(decimalSeparator, 'g'), ''));
};

const stripNonDecimals: (value: string, decimalSeparator: DecimalSeparator) => string
  = (value, decimalSeparator) => {
  if (!value)
    return '';
  const regExp = RegExp(decimalSeparator ? `[^\\d${decimalSeparator}]` : '\\D', 'g');
  return value.replace(regExp, '');
};

const allowDigitsOnly: (value: string) => string = value => value.replace(/\D/g, '');

const countDigitGroups: (value: string | number, groupLength: number) => number =
  (value, groupLength = 3) =>
    Math.ceil(((typeof value === 'string') ? allowDigitsOnly(value).length : value) / groupLength);

const findDigitGroupingDelimiterIndices: (param: DigitGroupingDelimiterPositionsParam) => number[] = param => {
  const indices: number[] = [];
  for (let i = 0, j = 0; (i < param.subject.length) && (j < param.maxDigits); i++)
    if (param.subject[i] === param.delimiter)
      indices.push(i);
    else
      j++;
  return indices;
};

const getLengthIncreaseAfterGroupingDigits: (param: DigitGroupingDelimiterPositionsParam) => number = param => {
  let delta = 0;
  findDigitGroupingDelimiterIndices(param).forEach(i => delta += (i <= param.maxDigits) ? 1 : 0);
  return delta;
};

export const INDIGIT_UTILS: {
  haveEqualDigitGroupsCount: (value1: string | number, value2: string | number, groupLength: number) => boolean;
  standardizeDecimalSeparator: (value: string, decimalSeparator: DecimalSeparator) => string;
  customizeDecimalSeparator: (value: string, decimalSeparator: DecimalSeparator) => string;
  sanitizeDecimalNumber: (value: string, decimalSeparator: DecimalSeparator) => string;
  allowDigitsOnly: typeof allowDigitsOnly;
  getIntegerPart: (value: string, decimalSeparator: DecimalSeparator) => string;
  getDecimalPart: (value: string, decimalSeparator: DecimalSeparator) => string;
  findFirstDifferentIndexFromEnd: (string1: string, string2: string) => number;
  restoreIndicatorAfterSingleDecimalDigitRemoval: (param: IndexPositioningParam) => number;
  restoreIndicatorAfterSingleIntegerDigitRemoval: (param: IndexPositioningParam) => number;
  isAllowedKey: (event: KeyboardEvent) => boolean;
  isLegalNumKey: (key: string) => boolean;
  digitGroups: (value: number | string, params: { separator?: string; groupLength?: number; }) => string;
  stripNonDecimals: (value: string, decimalSeparator: DecimalSeparator) => string;
  numFaToEn: (value: string) => string;
} = {

  haveEqualDigitGroupsCount:
    (value1, value2, groupLength) => countDigitGroups(value1, groupLength) === countDigitGroups(value2, groupLength),

  standardizeDecimalSeparator: (value, decimalSeparator) => {
    const val = stripNonDecimals(value, decimalSeparator);
    if (!val)
      return '';
    const i = val.indexOf(decimalSeparator);
    return (i < 0) ? val : `${val.substring(0, i)}.${val.substring(i + 1)}`;
  },

  customizeDecimalSeparator: (value, decimalSeparator) => {
    const val = stripNonDecimals(value, '.');
    if (!val)
      return '';
    const i = val.indexOf('.');
    return (i < 0) ? val : `${val.substring(0, i)}${decimalSeparator}${val.substring(i + 1)}`;
  },

  sanitizeDecimalNumber: (value, decimalSeparator) => {
    const val = stripNonDecimals(value.trim(), decimalSeparator);
    if (!val)
      return '';
    return decimalSeparator ? deduplicateDecimalSeparator(val, decimalSeparator) : val;
  },

  allowDigitsOnly: value => allowDigitsOnly(value),

  getIntegerPart: (value, decimalSeparator) => {
    const val = stripNonDecimals(value, decimalSeparator);
    if (!val)
      return '';
    const i = val.indexOf(decimalSeparator);
    return (i < 0) ? val : val.substring(0, i);
  },

  getDecimalPart: (value, decimalSeparator) => {
    const val = stripNonDecimals(value, decimalSeparator);
    if (!val)
      return '';
    const i = val.indexOf(decimalSeparator);
    return (i > -1) ? val.substring(i + 1) : '';
  },

  findFirstDifferentIndexFromEnd: (string1, string2) => {
    let big = string2;
    let small = string1;
    let isGrown = true;
    if (string1.length > string2.length) {
      big = string1;
      small = string2;
      isGrown = false;
    }
    let bigLast = big.length - 1;
    let smallLast = small.length - 1;
    while (smallLast > -1) {
      if (small[smallLast] !== big[bigLast])
        break;
      smallLast--;
      bigLast--;
    }
    return isGrown ? bigLast : smallLast;
  },

  restoreIndicatorAfterSingleDecimalDigitRemoval: param => {
    const separatorIndex = param.postDeleteVal.indexOf(param.decimalSeparator);
    const leftPartLength = allowDigitsOnly(param.preDeleteVal.substring(separatorIndex + 1, param.preDeleteIndex)).length;
    const postDigitGroupingIncrease = getLengthIncreaseAfterGroupingDigits({
      subject: param.postDeleteVal.substring(separatorIndex + 1),
      delimiter: param.delimiter,
      maxDigits: leftPartLength
    });
    return separatorIndex + 1 + leftPartLength + postDigitGroupingIncrease;
  },

  restoreIndicatorAfterSingleIntegerDigitRemoval: param => {
    const separatorIndex = param.postDeleteVal.indexOf(param.decimalSeparator);
    const leftPartLength = allowDigitsOnly(param.preDeleteVal.substring(0, param.preDeleteIndex)).length;
    const postDigitGroupingIncrease = getLengthIncreaseAfterGroupingDigits({
      subject: param.postDeleteVal.substring(0, separatorIndex),
      delimiter: param.delimiter,
      maxDigits: leftPartLength
    });
    return leftPartLength + postDigitGroupingIncrease;
  },

  isAllowedKey: event => {
    if (event.altKey || event.ctrlKey || event.shiftKey)
      return true;
    switch (event.key) {
      // Control keys
      case 'Tab':
      case 'Enter':
      case 'Insert':
      // Lock toggles
      case 'CapsLock':
      case 'NumLock':
      case 'ScrollLock':
      // Navigation
      case 'PageUp':
      case 'PageDown':
      case 'Home':
      case 'End':
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      // Functional
      case 'F1':
      case 'F2':
      case 'F3':
      case 'F4':
      case 'F5':
      case 'F6':
      case 'F7':
      case 'F8':
      case 'F9':
      case 'F10':
      case 'F11':
      case 'F12':
      case 'F21':
      // Miscellaneous
      case 'Meta':
      case 'Pause':
      case 'ContextMenu':
      case 'AudioVolumeMute':
      case 'AudioVolumeUp':
      case 'AudioVolumeDown':
      case 'MediaPlayPause':
      case 'LaunchApplication2':
        return true;
    }
    return false;
  },

  isLegalNumKey: key => {
    return /[\u0660-\u0669\u06f0-\u06f9\d]/.test(key);
  },

  digitGroups: (value, params) => {
    const parameters = Object.assign({}, { separator: ',', groupLength: 3 }, params);
    if ('number' === typeof value)
      return String(value).replace(RegExp('(\\d)(?=(\\d{' + parameters.groupLength + '})+$)', 'g'), '$1' + parameters.separator);
    return value?.replace(RegExp('(\\d)(?=(\\d{' + parameters.groupLength + '})+$)', 'g'), '$1' + parameters.separator) || '';
  },

  stripNonDecimals: (value, decimalSeparator) => stripNonDecimals(value, decimalSeparator),

  numFaToEn: t => {
    return t ? t
        .replace(/[\u0660-\u0669]/g, c => String(c.charCodeAt(0) - 0x0660))
        .replace(/[\u06f0-\u06f9]/g, c => String(c.charCodeAt(0) - 0x06f0))
      : '';
  },

};
