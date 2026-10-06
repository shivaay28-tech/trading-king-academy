import type { Instrument } from '@/types'

export const instruments: Instrument[] = [
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    sessionNote: 'Often most active during the London–New York overlap. Spreads can widen around CPI, NFP, and ECB or Fed decisions.',
  },
  {
    symbol: 'GBPUSD',
    name: 'Pound / US Dollar',
    sessionNote: 'Sensitive to UK data and BoE communication, and to USD events. Liquidity typically improves in the London session.',
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Yen',
    sessionNote: 'Often active in Tokyo and again when US yields move in New York. Quoted to three decimals, where the second decimal is the pip.',
  },
  {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    sessionNote: 'Can react to SNB comments and to risk sentiment. Liquidity is usually best in the European session.',
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    sessionNote: 'Often moves with Asia-Pacific data, China headlines, and metal prices, then again in the New York session.',
  },
  {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    sessionNote: 'Sensitive to oil headlines and to Canadian and US data. Liquidity improves into the New York session.',
  },
  {
    symbol: 'NZDUSD',
    name: 'New Zealand Dollar / US Dollar',
    sessionNote: 'Often quieter than the majors. Dairy auctions, RBNZ communication, and the Asian session matter.',
  },
  {
    symbol: 'EURGBP',
    name: 'Euro / Pound',
    sessionNote: 'A dollar-free cross. ECB and BoE events can move it even when the dollar is quiet.',
  },
  {
    symbol: 'EURJPY',
    name: 'Euro / Yen',
    sessionNote: 'Combines euro data with yen and yield moves. Often busiest from London into the New York overlap.',
  },
  {
    symbol: 'EURCHF',
    name: 'Euro / Swiss Franc',
    sessionNote: 'A European cross. SNB and ECB communication can change the quote quickly.',
  },
  {
    symbol: 'EURAUD',
    name: 'Euro / Australian Dollar',
    sessionNote: 'A cross of two sessions. It can be active in Asia and again when Europe opens.',
  },
  {
    symbol: 'GBPJPY',
    name: 'Pound / Yen',
    sessionNote: 'Often wider than the majors. UK data and yen moves can both show up in the same candle.',
  },
  {
    symbol: 'GBPAUD',
    name: 'Pound / Australian Dollar',
    sessionNote: 'A cross that can stay active from Asia into London. Spreads are usually wider than EURUSD.',
  },
  {
    symbol: 'GBPCAD',
    name: 'Pound / Canadian Dollar',
    sessionNote: 'Combines UK news with oil-sensitive CAD. The London and New York sessions are the useful windows.',
  },
  {
    symbol: 'AUDJPY',
    name: 'Australian Dollar / Yen',
    sessionNote: 'Often treated as a risk-sentiment cross. Asia is the first session, then London can extend the move.',
  },
  {
    symbol: 'CADJPY',
    name: 'Canadian Dollar / Yen',
    sessionNote: 'Oil headlines and yen yields can both matter. New York is usually the more liquid window.',
  },
  {
    symbol: 'NZDJPY',
    name: 'New Zealand Dollar / Yen',
    sessionNote: 'A thinner cross. Asia is the natural session, and spreads can widen outside it.',
  },
  {
    symbol: 'XAUUSD',
    name: 'Gold vs US Dollar',
    sessionNote: 'Gold can move quickly around real-yield and USD narratives. Contract size and tick value differ from FX pairs — always read the specification.',
  },
  {
    symbol: 'XAGUSD',
    name: 'Silver vs US Dollar',
    sessionNote: 'Silver is quoted in dollars per ounce and can move faster than gold. US hours and USD moves are the usual windows.',
  },
  {
    symbol: 'US30',
    name: 'US 30 cash CFD',
    sessionNote: 'Index CFDs follow US equity-hours more than the FX calendar. Gaps around cash-session opens are a risk topic, not a signal.',
  },
  {
    symbol: 'NAS100',
    name: 'US 100 cash CFD',
    sessionNote: 'Tech-heavy index CFDs can be more volatile around US hours and mega-cap news. Product specs differ from FX pip values.',
  },
  {
    symbol: 'US500',
    name: 'US 500 cash CFD',
    sessionNote: 'Tracks the broad US equity benchmark. The cash session and US data are the times that usually matter.',
  },
  {
    symbol: 'GER40',
    name: 'Germany 40 cash CFD',
    sessionNote: 'A European index CFD. The Frankfurt cash session and euro-area data are the main windows.',
  },
  {
    symbol: 'UK100',
    name: 'UK 100 cash CFD',
    sessionNote: 'Follows the London equity session more than the FX clock. UK data and the cash open can gap the quote.',
  },
  {
    symbol: 'JP225',
    name: 'Japan 225 cash CFD',
    sessionNote: 'Follows the Tokyo equity session. Yen moves and the cash open are the usual study points.',
  },
  {
    symbol: 'USOIL',
    name: 'US Crude oil CFD',
    sessionNote: 'Energy CFDs react to inventory data, OPEC headlines, and USD moves. Overnight financing and contract months belong in the product document.',
  },
  {
    symbol: 'UKOIL',
    name: 'Brent crude CFD',
    sessionNote: 'Brent reacts to the same energy calendar as US crude, with a European supply focus. Read the contract specification before talking about size.',
  },
]
