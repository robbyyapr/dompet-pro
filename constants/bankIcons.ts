// Bank and E-Wallet icon mappings using CDN logos
// Uses clearbit logo API and fallback emoji icons

export interface BankIconInfo {
  name: string;
  keywords: string[];
  logo: string;
  color: string;
  emoji: string;
}

// Indonesian banks and e-wallets with their logo URLs
export const BANK_ICONS: BankIconInfo[] = [
  // Major Banks
  { 
    name: 'BCA', 
    keywords: ['bca', 'bank central asia'], 
    logo: 'https://logo.clearbit.com/bca.co.id',
    color: '#003d79',
    emoji: '🏦'
  },
  { 
    name: 'Mandiri', 
    keywords: ['mandiri', 'bank mandiri'], 
    logo: 'https://logo.clearbit.com/bankmandiri.co.id',
    color: '#003366',
    emoji: '🏦'
  },
  { 
    name: 'BNI', 
    keywords: ['bni', 'bank negara indonesia'], 
    logo: 'https://logo.clearbit.com/bni.co.id',
    color: '#f15a22',
    emoji: '🏦'
  },
  { 
    name: 'BRI', 
    keywords: ['bri', 'bank rakyat indonesia'], 
    logo: 'https://logo.clearbit.com/bri.co.id',
    color: '#00529c',
    emoji: '🏦'
  },
  { 
    name: 'CIMB Niaga', 
    keywords: ['cimb', 'niaga', 'cimb niaga'], 
    logo: 'https://logo.clearbit.com/cimbniaga.co.id',
    color: '#7b0c15',
    emoji: '🏦'
  },
  { 
    name: 'Permata', 
    keywords: ['permata', 'bank permata'], 
    logo: 'https://logo.clearbit.com/permatabank.com',
    color: '#00a650',
    emoji: '🏦'
  },
  { 
    name: 'Danamon', 
    keywords: ['danamon', 'bank danamon'], 
    logo: 'https://logo.clearbit.com/danamon.co.id',
    color: '#003b70',
    emoji: '🏦'
  },
  { 
    name: 'Panin', 
    keywords: ['panin', 'bank panin'], 
    logo: 'https://logo.clearbit.com/panin.co.id',
    color: '#0066b3',
    emoji: '🏦'
  },
  { 
    name: 'OCBC NISP', 
    keywords: ['ocbc', 'nisp', 'ocbc nisp'], 
    logo: 'https://logo.clearbit.com/ocbcnisp.com',
    color: '#ed1c24',
    emoji: '🏦'
  },
  { 
    name: 'BTN', 
    keywords: ['btn', 'bank tabungan negara'], 
    logo: 'https://logo.clearbit.com/btn.co.id',
    color: '#f47920',
    emoji: '🏦'
  },
  { 
    name: 'Maybank', 
    keywords: ['maybank'], 
    logo: 'https://logo.clearbit.com/maybank.co.id',
    color: '#ffc72c',
    emoji: '🏦'
  },
  { 
    name: 'HSBC', 
    keywords: ['hsbc'], 
    logo: 'https://logo.clearbit.com/hsbc.co.id',
    color: '#db0011',
    emoji: '🏦'
  },
  { 
    name: 'Standard Chartered', 
    keywords: ['standard chartered', 'sc', 'stanchart'], 
    logo: 'https://logo.clearbit.com/sc.com',
    color: '#0072aa',
    emoji: '🏦'
  },
  { 
    name: 'Citibank', 
    keywords: ['citi', 'citibank'], 
    logo: 'https://logo.clearbit.com/citibank.co.id',
    color: '#003b70',
    emoji: '🏦'
  },
  { 
    name: 'DBS', 
    keywords: ['dbs', 'bank dbs'], 
    logo: 'https://logo.clearbit.com/dbs.com',
    color: '#e31937',
    emoji: '🏦'
  },
  { 
    name: 'UOB', 
    keywords: ['uob'], 
    logo: 'https://logo.clearbit.com/uob.co.id',
    color: '#0b3d91',
    emoji: '🏦'
  },
  { 
    name: 'Bank Mega', 
    keywords: ['mega', 'bank mega'], 
    logo: 'https://logo.clearbit.com/bankmega.com',
    color: '#003f72',
    emoji: '🏦'
  },
  { 
    name: 'Bukopin', 
    keywords: ['bukopin', 'bank bukopin', 'kb bukopin'], 
    logo: 'https://logo.clearbit.com/bukopin.co.id',
    color: '#003366',
    emoji: '🏦'
  },
  { 
    name: 'Sinarmas', 
    keywords: ['sinarmas', 'bank sinarmas'], 
    logo: 'https://logo.clearbit.com/banksinarmas.com',
    color: '#fdb913',
    emoji: '🏦'
  },
  { 
    name: 'Bank Jago', 
    keywords: ['jago', 'bank jago'], 
    logo: 'https://logo.clearbit.com/jfrfrago.co.id',
    color: '#ffcc00',
    emoji: '🏦'
  },
  { 
    name: 'Jenius', 
    keywords: ['jenius', 'btpn jenius'], 
    logo: 'https://logo.clearbit.com/jenius.com',
    color: '#00a9e0',
    emoji: '🏦'
  },
  { 
    name: 'Seabank', 
    keywords: ['seabank', 'sea bank'], 
    logo: 'https://logo.clearbit.com/seabank.co.id',
    color: '#ee4d2d',
    emoji: '🏦'
  },
  { 
    name: 'Bank Neo', 
    keywords: ['neo', 'bank neo', 'neo commerce'], 
    logo: 'https://logo.clearbit.com/bankneo.co.id',
    color: '#6366f1',
    emoji: '🏦'
  },
  { 
    name: 'Blu BCA', 
    keywords: ['blu', 'blu bca', 'blu by bca'], 
    logo: 'https://logo.clearbit.com/blubybcadigital.id',
    color: '#0066ff',
    emoji: '🏦'
  },
  { 
    name: 'Line Bank', 
    keywords: ['line bank', 'linebank'], 
    logo: 'https://logo.clearbit.com/linebank.co.id',
    color: '#06c755',
    emoji: '🏦'
  },
  { 
    name: 'Allo Bank', 
    keywords: ['allo', 'allo bank'], 
    logo: 'https://logo.clearbit.com/allobank.com',
    color: '#ff6b00',
    emoji: '🏦'
  },
  { 
    name: 'BSI', 
    keywords: ['bsi', 'bank syariah', 'bank syariah indonesia'], 
    logo: 'https://logo.clearbit.com/bankbsi.co.id',
    color: '#00a551',
    emoji: '🏦'
  },
  
  // E-Wallets
  { 
    name: 'GoPay', 
    keywords: ['gopay', 'go pay', 'gojek'], 
    logo: 'https://logo.clearbit.com/gojek.com',
    color: '#00aa13',
    emoji: '📱'
  },
  { 
    name: 'OVO', 
    keywords: ['ovo'], 
    logo: 'https://logo.clearbit.com/ovo.id',
    color: '#4c3494',
    emoji: '📱'
  },
  { 
    name: 'DANA', 
    keywords: ['dana'], 
    logo: 'https://logo.clearbit.com/dana.id',
    color: '#108ee9',
    emoji: '📱'
  },
  { 
    name: 'ShopeePay', 
    keywords: ['shopee', 'shopeepay', 'spay'], 
    logo: 'https://logo.clearbit.com/shopee.co.id',
    color: '#ee4d2d',
    emoji: '📱'
  },
  { 
    name: 'LinkAja', 
    keywords: ['linkaja', 'link aja'], 
    logo: 'https://logo.clearbit.com/linkaja.id',
    color: '#e31e25',
    emoji: '📱'
  },
  { 
    name: 'PayPal', 
    keywords: ['paypal', 'pay pal'], 
    logo: 'https://logo.clearbit.com/paypal.com',
    color: '#003087',
    emoji: '📱'
  },
  { 
    name: 'Flip', 
    keywords: ['flip'], 
    logo: 'https://logo.clearbit.com/flip.id',
    color: '#ff6100',
    emoji: '📱'
  },
  { 
    name: 'DOKU', 
    keywords: ['doku'], 
    logo: 'https://logo.clearbit.com/doku.com',
    color: '#e21b1b',
    emoji: '📱'
  },
  { 
    name: 'Kredivo', 
    keywords: ['kredivo'], 
    logo: 'https://logo.clearbit.com/kredivo.com',
    color: '#00aa5b',
    emoji: '💳'
  },
  { 
    name: 'Akulaku', 
    keywords: ['akulaku'], 
    logo: 'https://logo.clearbit.com/akulaku.com',
    color: '#f42728',
    emoji: '💳'
  },
  
  // Cash
  { 
    name: 'Cash', 
    keywords: ['cash', 'tunai', 'dompet', 'wallet'], 
    logo: '',
    color: '#22c55e',
    emoji: '💵'
  },
];

// Find matching bank/wallet by name
export const findBankIcon = (name: string): BankIconInfo | null => {
  const lowerName = name.toLowerCase();
  
  for (const bank of BANK_ICONS) {
    for (const keyword of bank.keywords) {
      if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
        return bank;
      }
    }
  }
  
  return null;
};

// Get icon (logo URL or emoji fallback)
export const getBankIconUrl = (name: string): string | null => {
  const bank = findBankIcon(name);
  return bank?.logo || null;
};

// Get bank color
export const getBankColor = (name: string): string => {
  const bank = findBankIcon(name);
  return bank?.color || '#6b7280';
};

// Get emoji fallback
export const getBankEmoji = (name: string): string => {
  const bank = findBankIcon(name);
  return bank?.emoji || '💰';
};

// Default icons by account type
export const DEFAULT_ICONS_BY_TYPE: Record<string, string> = {
  'Bank': '🏦',
  'E-Wallet': '📱',
  'Cash': '💵',
  'Credit': '💳'
};
