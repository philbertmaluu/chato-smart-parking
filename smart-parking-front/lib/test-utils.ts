import { cn } from './utils';

// Test the cn function
export function testCnFunction() {
  const result = cn(
    'bg-blue-500',
    'text-white',
    'px-4 py-2',
    'rounded',
    'hover:bg-blue-600'
  );
  
  console.log('✅ cn function test result:', result);
  return result;
}

// Test for common class combinations
export function testCommonClasses() {
  const buttonClasses = cn(
    'inline-flex items-center justify-center',
    'rounded-md text-sm font-medium',
    'transition-colors focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50'
  );
  
  console.log('✅ Button classes:', buttonClasses);
  return buttonClasses;
} 