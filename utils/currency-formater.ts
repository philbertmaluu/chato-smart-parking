/**
 * Format a number as currency with thousand separators and TSh
 * @param amount - The number to format
 * @returns Formatted currency string like "50,000.00 TSh"
 */
export function formatCurrency(
  amount: number | string
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.00 TSh';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatted = formatter.format(numAmount);
  
  return `${formatted} TSh`;
}

/**
 * Format currency with dots as thousand separators (European style)
 * @param amount - The number to format
 * @param currency - The currency symbol (default: '')
 * @returns Formatted currency string with dots as separators
 */
export function formatCurrencyWithDots(
  amount: number | string,
  currency: string = ''
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return currency ? `${currency} 0` : '0';
  }

  // Format with dots as thousand separators
  const formatted = numAmount.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return currency ? `${currency} ${formatted}` : formatted;
}

/**
 * Parse a formatted currency string back to a number
 * @param formattedAmount - The formatted currency string
 * @returns The numeric value
 */
export function parseCurrency(formattedAmount: string): number {
  // Remove currency symbols and non-numeric characters except dots and commas
  const cleaned = formattedAmount.replace(/[^\d.,]/g, '');
  
  // Handle different decimal separators
  let normalized = cleaned;
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // If both dots and commas exist, assume dots are thousand separators
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // If only comma exists, it could be decimal separator (European style)
    // or thousand separator (American style) - assume decimal for now
    normalized = cleaned.replace(',', '.');
  }
  
  return parseFloat(normalized) || 0;
}
