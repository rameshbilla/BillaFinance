export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  if (!num || isNaN(num)) return '';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teenDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const doubleDigits = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertToWords(n: number): string {
    let word = '';
    if (n >= 100) {
      word += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      word += doubleDigits[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n >= 10) {
      word += teenDigits[n - 10] + ' ';
    } else if (n > 0) {
      word += singleDigits[n] + ' ';
    }
    return word;
  }

  let result = '';
  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore > 0) result += convertToWords(crore) + 'Crore ';
  if (lakh > 0) result += convertToWords(lakh) + 'Lakh ';
  if (thousand > 0) result += convertToWords(thousand) + 'Thousand ';
  if (num > 0) {
    if (result !== '' && num < 100) result += 'and ';
    result += convertToWords(num);
  }

  return (result.trim() + ' Only').replace(/\s+/g, ' ');
}
