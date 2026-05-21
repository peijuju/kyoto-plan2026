/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from './contexts/FirebaseContext';
import { 
  Calendar, 
  Wallet, 
  Map as MapIcon, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Cloud, 
  Sun, 
  CloudRain, 
  Camera, 
  Plane, 
  Hotel, 
  Bed,
  Phone, 
  CheckCircle2, 
  Circle,
  ArrowRightLeft,
  Info,
  Link,
  ExternalLink,
  Sparkles,
  Clock,
  GripVertical,
  X,
  Utensils,
  MapPin,
  Globe,
  Calendar as CalendarIcon,
  Navigation,
  Navigation2,
  TrainFront,
  Ticket,
  Luggage,
  Bus,
  Share2,
  Copy,
  Users,
  Sunrise,
  Sunset,
  BookOpen,
  Hourglass,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from './lib/utils';
import { 
  ItineraryData, 
  DayPlan, 
  Spot, 
  Category, 
  Expense, 
  ShoppingItem, 
  PackingItem,
  FlightInfo,
  HotelInfo,
  ExpenseCategory,
  TransportOrder
} from './types';

// Helper function to lazily initialize Gemini client and check for API key
const getAiInstance = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey === '') {
    throw new Error('未設定 Gemini API 金鑰。因 GitHub Pages 為公開靜態網頁，並未包含您的私密金鑰，如常需使用 AI，請在專案中設定或確保環境變數已注入。');
  }
  return new GoogleGenAI({ apiKey });
};

const INITIAL_DATA: ItineraryData = {
  title: "2026 日本關西母女之旅",
  year: "2026",
  dateRange: "2026/06/05 – 06/11 (7天6夜)",
  days: [
    {
      id: 'day1',
      date: '06.05 (五)',
      title: 'Day 1',
      location: '抵達關西 ➔ 京都 (彈性雙交通方案)',
      city: '京都市',
      spots: [
        { id: 's1', time: '18:15', location: '抵達關西機場 (KIX-T2)', category: 'transport', description: '辦理入境，領取兩件 28 吋行李。', travelTimeNext: '60m', stayDuration: '60m', locationJp: '関西空港', googleMapUrl: 'https://maps.app.goo.gl/KIX', address: '大阪府泉佐野市泉州空港北1' },
        { id: 's2', time: '19:30', location: '交通抉擇', category: 'transport', description: '首選方案 (利木津巴士)：8號月台 (2,600円)；備案方案 (JR HARUKA)：JR 站換票 (2,200円)。', travelTimeNext: '75m', stayDuration: '30m' },
        { id: 's3', time: '21:00', location: 'Hotel The M\'s Kyoto', category: 'hotel', description: 'Check-in 安置大行李。', travelTimeNext: '30m', stayDuration: '60m', locationJp: 'ホテル・ザ・エムズ・京都', googleMapUrl: 'https://maps.app.goo.gl/HotelTheMsKyoto', address: '京都市下京区東塩小路町' },
        { id: 's4', time: '21:30', location: '京都站周邊晚餐', category: 'food', description: '由於抵達較晚，建議在京都站周邊或飯店附近尋找營業較晚的餐廳或便利商店。', travelTimeNext: '15m', stayDuration: '60m' },
        { id: 's5', time: '22:30', location: '休息', category: 'other', description: '養精蓄銳，準備明天的行程。', stayDuration: '60m' },
      ],
      weather: { temp: '24°C', condition: '晴時多雲', icon: 'cloud-sun', rainProb: '20%' }
    },
    {
      id: 'day2',
      date: '06.06 (六)',
      title: 'Day 2',
      location: '伏見鳥居 ➔ 宇治紫陽花與抹茶',
      city: '宇治市',
      spots: [
        { id: 's6', time: '09:30', location: '伏見稻荷大社', category: 'sightseeing', description: '趁早拍「千本鳥居」，此時光線最美。', travelTimeNext: '30m', stayDuration: '90m', locationJp: '伏見稲荷大社' },
        { id: 's7', time: '11:00', location: '藤森神社', category: 'sightseeing', description: '季節限定。6月紫陽花祭，是非常適合母女合照的祕境。', travelTimeNext: '30m', stayDuration: '60m', locationJp: '藤森神社' },
        { id: 's8', time: '12:30', location: '京うどん 三よしや', category: 'food', description: '宇治在地人氣烏龍麵，麵條Q彈適合長輩。', travelTimeNext: '15m', stayDuration: '60m', locationJp: '京うどん 三よしや' },
        { id: 's9', time: '14:00', location: '平等院', category: 'sightseeing', description: '參觀 10 元硬幣上的鳳凰堂。', travelTimeNext: '15m', stayDuration: '90m', locationJp: '平等院' },
        { id: 's10', time: '15:30', location: '中村藤吉 (平等院店)', category: 'food', description: '攻略： 一到宇治先去店面抽號碼牌，逛完平等院剛好回來吃。', stayDuration: '60m', locationJp: '中村藤吉 平等院店' },
      ],
      weather: { temp: '26°C', condition: '晴', icon: 'sun', rainProb: '10%' }
    },
    {
      id: 'day3',
      date: '06.07 (日)',
      title: 'Day 3',
      location: '侘寂銀閣寺 ➔ 最萌兔子神社 ➔ 夢幻豬排',
      city: '京都市',
      spots: [
        { id: 's11', time: '10:00', location: '銀閣寺', category: 'sightseeing', description: '欣賞枯山水與銀沙灘，整體氛圍安靜優雅。', travelTimeNext: '40m', stayDuration: '90m', locationJp: '銀閣寺' },
        { id: 's12', time: '12:00', location: '哲學之道周邊簡餐', category: 'food', description: '隨意找間小店感受寧靜。', travelTimeNext: '30m', stayDuration: '60m', locationJp: '哲学の道' },
        { id: 's13', time: '14:00', location: '岡崎神社', category: 'sightseeing', description: '全京都最可愛的兔子神社，洗手池與求籤兔必拍。', travelTimeNext: '30m', stayDuration: '60m', locationJp: '岡崎神社' },
        { id: 's14', time: '16:00', location: '南禪寺水路閣', category: 'sightseeing', description: '紅磚拱橋拍照很有日劇場景感。', travelTimeNext: '40m', stayDuration: '60m', locationJp: '南禅寺 水路閣' },
        { id: 's15', time: '18:30', location: '宮川豚衛門', category: 'food', description: '預約攻略： 務必提前在 TableCheck 預約「林SPF熟成豬排」。', stayDuration: '90m', locationJp: '宮川町 豚衛門' },
      ],
      weather: { temp: '25°C', condition: '晴', icon: 'sun', rainProb: '0%' }
    },
    {
      id: 'day4',
      date: '06.08 (一)',
      title: 'Day 4',
      location: '清水寺經典 ➔ 高島屋動漫限定採購',
      city: '京都市',
      spots: [
        { id: 's16', time: '09:30', location: '清水寺', category: 'sightseeing', description: '6月翠綠山景環繞。參拜完後走二、三年坂。', travelTimeNext: '30m', stayDuration: '120m', locationJp: '清水寺' },
        { id: 's17', time: '11:30', location: '二寧坂榻榻米星巴克', category: 'food', description: '體驗世界唯一坐在榻榻米喝咖啡。', travelTimeNext: '60m', stayDuration: '60m', locationJp: 'スターバックス コーヒー 京都二寧坂ヤサカ茶屋店' },
        { id: 's18', time: '15:00', location: '京都高島屋 S.C. (T8)', category: 'shopping', description: '購物重點：Nintendo KYOTO、Chiikawa Land。', travelTimeNext: '60m', stayDuration: '120m', locationJp: '京都高島屋S.C.' },
        { id: 's19', time: '18:00', location: '八坂神社', category: 'sightseeing', description: '欣賞祇園舞殿點燈，隨後在四條河原町晚餐。', stayDuration: '90m', locationJp: '八坂神社' },
      ],
      weather: { temp: '23°C', condition: '多雲', icon: 'cloud', rainProb: '30%' }
    },
    {
      id: 'day5',
      date: '06.09 (二)',
      title: 'Day 5',
      location: '錦市場巡禮 ➔ 鴨川漫步 ➔ 百貨補貨',
      city: '京都市',
      spots: [
        { id: 's20', time: '10:00', location: '錦市場', category: 'food', description: '體驗「京都廚房」。攻略： 買三木雞卵的玉子燒分食。', travelTimeNext: '30m', stayDuration: '90m', locationJp: '錦市場' },
        { id: 's21', time: '12:00', location: '錦市場小吃巡禮', category: 'food', description: '豆乳甜甜圈、漬物串。', travelTimeNext: '60m', stayDuration: '60m' },
        { id: 's22', time: '14:30', location: '鴨川散策', category: 'sightseeing', description: '6月若氣候涼爽，可去跳「烏龜石」。', travelTimeNext: '40m', stayDuration: '60m', locationJp: '鴨川' },
        { id: 's23', time: '16:30', location: '自由時間', category: 'shopping', description: '四條河原町大丸/高島屋百貨最後掃貨。', travelTimeNext: '60m', stayDuration: '120m' },
        { id: 's24', time: '19:00', location: '高木咖啡', category: 'food', description: '體驗昭和風情西式晚餐。', stayDuration: '90m', locationJp: '高木珈琲店' },
      ],
      weather: { temp: '22°C', condition: '陰', icon: 'cloud', rainProb: '40%' }
    },
    {
      id: 'day6',
      date: '06.10 (三)',
      title: 'Day 6',
      location: '【空手觀光】大阪地標 ➔ 慶功燒肉',
      city: '大阪市',
      spots: [
        { id: 's25', time: '09:00', location: '行李運送 (Klook)', category: 'transport', description: '關鍵操作： 飯店櫃檯交付 28 吋大箱。兩手空空去大阪。', travelTimeNext: '60m', stayDuration: '30m' },
        { id: 's26', time: '11:00', location: '難波八阪神社', category: 'sightseeing', description: '與巨大獅子殿合照（10點前陽光最佳）。', travelTimeNext: '40m', stayDuration: '60m', locationJp: '難波八阪神社' },
        { id: 's27', time: '12:30', location: '道頓堀巡禮', category: 'food', description: '吃章魚燒、蟹道樂（外帶烤蟹腳）。', travelTimeNext: '30m', stayDuration: '90m', locationJp: '道頓堀' },
        { id: 's28', time: '14:00', location: '心齋橋購物', category: 'shopping', description: '大丸百貨、藥妝店、UNIQLO 最後衝刺。', travelTimeNext: '60m', stayDuration: '120m', locationJp: '心斎橋筋商店街' },
        { id: 's29', time: '16:30', location: '前往臨空城', category: 'transport', description: '搭乘南海電鐵（45min）。', travelTimeNext: '60m', stayDuration: '60m' },
        { id: 's30', time: '18:30', location: '燒肉 One Karubi', category: 'food', description: '預約攻略： 務必預約「點餐式吃到飽」，坐著等美食。', travelTimeNext: '30m', stayDuration: '120m', locationJp: 'ワンカルビ' },
        { id: 's31', time: '21:00', location: '唐吉訶德', category: 'shopping', description: '飯店旁最後大採買，回 Star Gate Hotel 領取已送達的行李。', stayDuration: '60m', locationJp: 'ドン・キホーテ' },
      ],
      weather: { temp: '25°C', condition: '晴', icon: 'sun', rainProb: '10%' }
    },
    {
      id: 'day7',
      date: '06.11 (四)',
      title: 'Day 7',
      location: '高空早餐 ➔ 從容賦歸',
      city: '泉佐野市',
      spots: [
        { id: 's32', time: '07:30', location: '飯店早餐', category: 'food', description: '在 54 樓餐廳俯瞰關西機場跑道。', travelTimeNext: '30m', stayDuration: '60m' },
        { id: 's33', time: '08:45', location: '前往機場', category: 'transport', description: '搭一站電車（5min）或利用飯店接駁車。', travelTimeNext: '30m', stayDuration: '60m' },
        { id: 's34', time: '10:45', location: '班機起飛', category: 'transport', description: '返回高雄，結束充實的旅程。', locationJp: '関西空港' },
      ],
      weather: { temp: '24°C', condition: '晴', icon: 'sun', rainProb: '0%' }
    }
  ],
  expenses: [],
  shoppingList: [
    { id: 'shop1', name: 'Chiikawa 娃娃 (京都限定)', remarks: '京都高島屋 S.C. (T8)', completed: false },
    { id: 'shop2', name: '岡崎神社兔子御守', remarks: '求好運', completed: false },
    { id: 'shop3', name: '三木雞卵玉子燒', remarks: '錦市場', completed: false },
    { id: 'shop4', name: '兔子籤', remarks: '宇治神社', completed: false },
  ],
  packingList: [
    { id: 'p1', name: '護照', quantity: 1, category: 'carry-on', completed: true },
    { id: 'p2', name: '行動電源', quantity: 2, category: 'carry-on', completed: false },
    { id: 'p3', name: '輕量折疊傘', quantity: 1, category: 'carry-on', completed: false },
    { id: 'p4', name: '薄外套', quantity: 1, category: 'carry-on', completed: false },
  ],
  flights: [
    { id: 'f1', type: 'departure', airline: '樂桃航空', flightNumber: 'MM032', departureTime: '14:10', arrivalTime: '18:15', departureAirport: 'KHH', arrivalAirport: 'KIX-T2' },
    { id: 'f2', type: 'return', airline: '樂桃航空', flightNumber: 'MM031', departureTime: '10:45', arrivalTime: '13:10', departureAirport: 'KIX-T2', arrivalAirport: 'KHH' }
  ],
  hotels: [
    { id: 'h1', name: 'Hotel The M\'s Kyoto', address: '京都市下京区東塩小路町934', checkIn: '2026-06-05', checkOut: '2026-06-10' },
    { id: 'h2', name: 'Star Gate Hotel Kansai Airport', address: '大阪府泉佐野市りんくう往来北1', checkIn: '2026-06-10', checkOut: '2026-06-11' }
  ],
  transportOrders: [
    { id: 't1', name: '利木津巴士 (關西機場-京都)', time: '19:30', location: '關西機場 8號月台', url: '', remarks: '2,600円' },
    { id: 't2', name: 'JR HARUKA (關西機場-京都)', time: '19:30', location: '關西機場 JR 站', url: '', remarks: '2,200円' },
    { id: 't3', name: '行李運送 (Klook)', time: '09:00', location: '飯店櫃檯', url: '', remarks: '28 吋大箱' }
  ],
  convenienceStoreList: []
};

const CATEGORY_COLORS: Record<Category, string> = {
  food: 'bg-morandi-sand/20 text-morandi-clay',
  sightseeing: 'bg-morandi-sage/20 text-morandi-ash',
  transport: 'bg-morandi-blue/20 text-morandi-blue',
  shopping: 'bg-morandi-dust/20 text-morandi-clay',
  hotel: 'bg-morandi-clay/20 text-morandi-clay',
  other: 'bg-morandi-mist text-morandi-clay',
};

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  food: <Utensils size={14} />,
  sightseeing: <Camera size={14} />,
  transport: <Bus size={14} />,
  shopping: <ShoppingBag size={14} />,
  hotel: <Bed size={14} />,
  other: <Info size={14} />,
};

const CATEGORY_LABELS: Record<Category, string> = {
  food: '美食',
  sightseeing: '景點',
  transport: '交通&其它資訊',
  shopping: '購物',
  hotel: '住宿',
  other: '其它',
};

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: '餐飲',
  transport: '交通',
  hotel: '住宿',
  shopping: '購物',
  ticket: '門票',
  other: '其他',
};

function SortableSpot({ 
  spot, 
  dayId, 
  updateSpot, 
  deleteSpot, 
  onSpotClick,
  isLast,
  data
}: { 
  spot: Spot; 
  dayId: string; 
  updateSpot: (dayId: string, spotId: string, updates: Partial<Spot>) => void; 
  deleteSpot: (dayId: string, spotId: string) => void;
  onSpotClick: (dayId: string, spot: Spot) => void;
  isLast: boolean; 
  data: ItineraryData;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: spot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative flex gap-4 sm:gap-6">
      {/* Time & Marker */}
      <div className="flex flex-col items-center w-14 sm:w-16 flex-none">
        <div className="flex items-center gap-1 h-10">
          <span className="text-base sm:text-lg font-mono font-bold text-slate-800">
            {spot.time}
          </span>
          <span className="text-slate-300 text-[10px]">°</span>
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-morandi-sand/80 my-2 relative">
            {/* Travel Time Display - Positioned at the bottom of the line */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-morandi-sand/30 shadow-sm z-10">
              <Bus size={10} className="text-morandi-clay" />
              <input 
                className="bg-transparent border-none text-[10px] sm:text-xs font-black text-morandi-clay focus:outline-none w-10 sm:w-12 hover:bg-morandi-sand/20 rounded px-1 transition-colors text-center"
                value={spot.travelTimeNext || '0m'}
                onChange={e => updateSpot(dayId, spot.id, { travelTimeNext: e.target.value })}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>

      <div 
        onClick={() => onSpotClick(dayId, spot)}
        className="flex-1 pb-8 sm:pb-10 group relative cursor-pointer"
      >
        <div className="absolute top-3 right-3 flex items-center gap-3 z-10" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => deleteSpot(dayId, spot.id)}
            className="text-slate-200 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <div {...attributes} {...listeners} className="cursor-grab p-1 text-morandi-sand hover:text-morandi-clay transition-colors">
            <GripVertical size={18} />
          </div>
        </div>
        
          <div className={cn("space-y-4 sm:space-y-6 relative p-5 sm:p-6 rounded-[32px] border border-slate-200 bg-white shadow-md hover:shadow-lg transition-all")}>
            {/* Vertical Color Line */}
            <div className={cn("absolute left-0 top-4 bottom-4 w-1.5 rounded-full", 
              spot.category === 'food' ? 'bg-morandi-sand' :
              spot.category === 'shopping' ? 'bg-morandi-dust' :
              spot.category === 'hotel' ? 'bg-morandi-clay' :
              spot.category === 'transport' ? 'bg-morandi-blue' :
              spot.category === 'sightseeing' ? 'bg-morandi-sage' :
              'bg-morandi-mist'
            )} />
            
            <div className="flex flex-col gap-2">
              <div className={cn("inline-flex items-center self-start gap-1 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest", CATEGORY_COLORS[spot.category])}>
                {CATEGORY_ICONS[spot.category]}
                <span>{CATEGORY_LABELS[spot.category]}</span>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif text-slate-800 font-bold tracking-tight">
                  {spot.location}
                </h3>
                <a 
                  href={spot.googleMapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.address || spot.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-100 transition-colors"
                >
                  <Navigation size={14} />
                </a>
              </div>
            </div>
            {spot.address && (
              <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                <MapPin size={10} />
                <p>{spot.address}</p>
              </div>
            )}
            
            {/* Additional Info on Cover */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              {spot.phone && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Phone size={10} />
                  <span>{spot.phone}</span>
                </div>
              )}
              {spot.openingHours && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock size={10} />
                  <span>{spot.openingHours}</span>
                </div>
              )}
              {spot.stayDuration && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Hourglass size={10} />
                  <span>{spot.stayDuration}</span>
                </div>
              )}
            </div>
          </div>

          {(spot.description && spot.description !== '點擊編輯描述' && spot.description !== 'Click to edit description') && (
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2">
              {spot.description}
            </p>
          )}
        </div>
      </div>
    );
  }

function BoardingPass({ flight, onClick, onDelete }: { flight: FlightInfo; onClick: () => void; onDelete?: () => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer group relative"
    >
      {onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={12} />
        </button>
      )}
      <div className="bg-morandi-blue p-3 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Plane size={18} />
          <span className="text-xs font-black tracking-widest uppercase">{flight.airline}</span>
        </div>
        <span className="text-xs font-bold opacity-80">{flight.flightNumber}</span>
      </div>
      <div className="p-6 flex items-center justify-between relative">
        <div className="text-center flex-1">
          <p className="text-2xl font-black text-slate-800">{flight.departureAirport}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">{flight.departureTime}</p>
        </div>
        <div className="flex-[1.2] flex flex-col items-center px-4">
          <div className="w-full h-px bg-slate-100 relative">
            <Plane size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-morandi-blue" />
          </div>
          <div className="mt-3 flex flex-col items-center gap-1.5">
            {flight.duration && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{flight.duration}</span>
            )}
            {flight.baggageWeight && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                <Luggage size={10} />
                <span>{flight.baggageWeight}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-center flex-1">
          <p className="text-2xl font-black text-slate-800">{flight.arrivalAirport}</p>
          <p className="text-xs text-slate-400 font-bold mt-1">{flight.arrivalTime}</p>
        </div>
        
        {/* Perforation line */}
        <div className="absolute left-0 right-0 bottom-0 h-px border-t border-dashed border-slate-100 mx-6" />
      </div>
      <div className="px-6 py-3 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Ticket size={14} />
          <span>點擊查看登機證</span>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'daily' | 'billing' | 'guide' | 'shopping'>('daily');
  const [data, setData] = useState<ItineraryData>(() => {
    const saved = localStorage.getItem('kyoto_travel_data_2026_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration for expenses
        const expenses = (parsed.expenses || []).map((e: any) => ({
          ...e,
          amount: e.amount !== undefined ? e.amount : (e.amountJpy || e.amountTwd || 0),
          currency: e.currency || (e.amountJpy ? 'JPY' : 'TWD'),
          paymentMethod: e.paymentMethod || 'cash',
          category: e.category || 'other'
        }));
        
        const mergedData = {
          ...INITIAL_DATA,
          ...parsed,
          expenses,
          shoppingList: parsed.shoppingList || INITIAL_DATA.shoppingList || [],
          packingList: parsed.packingList || INITIAL_DATA.packingList || [],
          flights: parsed.flights || INITIAL_DATA.flights || [],
          hotels: parsed.hotels || INITIAL_DATA.hotels || [],
          transportOrders: parsed.transportOrders || INITIAL_DATA.transportOrders || []
        };

        // Ensure all 7 days are present for Kyoto trip
        if (mergedData.title === "京都旅行" && mergedData.days.length < 7) {
          mergedData.days = INITIAL_DATA.days;
        }

        return mergedData;
      } catch (e) {
        console.error("Failed to parse saved data:", e);
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

  const [selectedDayId, setSelectedDayId] = useState<string>(data.days[0]?.id || '');
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(0.21);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSpotModal, setShowSpotModal] = useState(false);
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightInfo | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<HotelInfo | null>(null);
  const [selectedTransportOrder, setSelectedTransportOrder] = useState<TransportOrder | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<{ dayId: string; spot: Spot } | null>(null);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [selectedShoppingItem, setSelectedShoppingItem] = useState<{ id: string; listType: 'shopping' | 'convenience' } | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showExpenseChartModal, setShowExpenseChartModal] = useState(false);
  const [expenseCurrency, setExpenseCurrency] = useState<'JPY' | 'TWD'>('JPY');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [generatingSpotId, setGeneratingSpotId] = useState<string | null>(null);
  const [currentTripId, setCurrentTripId] = useState<string | null>(localStorage.getItem('currentTripId'));

  const { user, signIn, logout, syncExpenses, updateExpense: syncUpdateExpense, deleteExpense: syncDeleteExpense, createTrip, joinTrip, listenToTripData, updateTrip, listenToTrip } = useFirebase();

  const tripMetadataRef = useRef<{ userId: string; collaborators: string[]; title: string; dateRange: string } | null>(null);
  const lastSyncedStrRef = useRef<string>('');

  // Create a new share trip
  const handleCreateShareTrip = async () => {
    if (!user) return;
    const newTripId = await createTrip('京都之行');
    if (newTripId) {
      setCurrentTripId(newTripId);
      localStorage.setItem('currentTripId', newTripId);
      
      // Sync current local expenses to the new shared trip
      await syncExpenses(data.expenses, newTripId);

      // Sync entire itinerary data (excluding details handled by line items sync)
      const cleanLocal = { ...data, expenses: [] };
      await updateTrip(
        newTripId,
        '京都之行',
        data.dateRange || '',
        [user.uid],
        user.uid,
        cleanLocal
      );
    }
  };

  const handleJoinTrip = async (id: string) => {
    if (!user) return;
    try {
      await joinTrip(id);
      setCurrentTripId(id);
      localStorage.setItem('currentTripId', id);
    } catch (err: any) {
      alert(err.message || '無法加入行程');
    }
  };

  const handleExitTrip = () => {
    setCurrentTripId(null);
    localStorage.removeItem('currentTripId');
    tripMetadataRef.current = null;
    lastSyncedStrRef.current = '';
  };

  // Sync expenses to cloud if logged in and in a shared trip
  const handleAddExpense = (expense: Expense) => {
    const isEdit = selectedExpense !== null;
    if (isEdit) {
      setData(prev => ({
        ...prev,
        expenses: prev.expenses.map(e => e.id === expense.id ? expense : e)
      }));
      if (user && currentTripId) syncUpdateExpense(expense, currentTripId);
    } else {
      setData(prev => ({ ...prev, expenses: [expense, ...prev.expenses] }));
      if (user && currentTripId) syncUpdateExpense(expense, currentTripId);
    }
  };

  const handleDeleteExpense = (id: string) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
    if (user && currentTripId) syncDeleteExpense(id, currentTripId);
  };

  // Real-time listener for shared trip master document (flights, hotels, shopping list etc.)
  useEffect(() => {
    if (!user || !currentTripId) return;

    const unsubscribe = listenToTrip(
      currentTripId,
      (tripDoc) => {
        if (!tripDoc) return;

        // Store latest metadata for updates
        tripMetadataRef.current = {
          userId: tripDoc.userId,
          collaborators: tripDoc.collaborators || [],
          title: tripDoc.title || '京都之行',
          dateRange: tripDoc.dateRange || ''
        };

        const remoteData = tripDoc.data as ItineraryData;
        if (!remoteData) return;

        // Normalize / remove expenses from comparison
        const cleanRemote = { ...remoteData, expenses: [] };
        const cleanLocal = { ...data, expenses: [] };

        const remoteStr = JSON.stringify(cleanRemote);
        const localStr = JSON.stringify(cleanLocal);

        if (remoteStr !== localStr) {
          console.log('Real-time sync: updating itinerary data from cloud...');
          lastSyncedStrRef.current = remoteStr;
          setData(prev => ({
            ...prev,
            ...remoteData,
            expenses: prev.expenses // Keep the expenses subcollection state
          }));
        }
      },
      (error: any) => {
        if (error.code === 'permission-denied') {
          console.warn('Access denied to trip, clearing state');
          handleExitTrip();
        }
      }
    );

    return () => unsubscribe();
  }, [user, currentTripId, listenToTrip]);

  // Sync local non-expense changes to cloud with debounce
  useEffect(() => {
    if (!user || !currentTripId || !tripMetadataRef.current) return;

    const cleanLocal = { ...data, expenses: [] };
    const localStr = JSON.stringify(cleanLocal);

    if (localStr === lastSyncedStrRef.current) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      const meta = tripMetadataRef.current;
      if (!meta) return;

      try {
        lastSyncedStrRef.current = localStr;
        await updateTrip(
          currentTripId,
          meta.title,
          meta.dateRange,
          meta.collaborators,
          meta.userId,
          cleanLocal
        );
        console.log('Itinerary updated & synchronized successfully to cloud');
      } catch (err) {
        console.error('Failed to auto-sync to cloud:', err);
      }
    }, 1500); // 1.5 seconds debounce

    return () => clearTimeout(timeoutId);
  }, [data, user, currentTripId, updateTrip]);

  // Real-time listener for shared expenses
  useEffect(() => {
    if (!user || !currentTripId) return;
    
    // Create an error-aware listener
    const unsubscribe = listenToTripData(
      currentTripId, 
      (expenses) => {
        setData(prev => ({
          ...prev,
          expenses: expenses.sort((a, b) => b.id.localeCompare(a.id))
        }));
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn('Access denied to trip, clearing state');
          handleExitTrip();
        }
      }
    );

    return () => unsubscribe();
  }, [user, currentTripId, listenToTripData]);

  // Fetch latest exchange rate daily
  useEffect(() => {
    const fetchExchangeRate = async () => {
      const urls = [
        'https://api.exchangerate-api.com/v4/latest/JPY',
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/jpy.json',
        'https://latest.currency-api.pages.dev/v1/currencies/jpy.json'
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          
          // Data structure varies by API
          let rate = 0;
          if (data && data.rates && data.rates.TWD) {
            rate = data.rates.TWD;
          } else if (data && data.jpy && data.jpy.twd) {
            rate = data.jpy.twd;
          }

          if (rate > 0) {
            setExchangeRate(rate);
            console.log(`Exchange rate updated from ${url}: ${rate}`);
            return; // Success
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${url}:`, err);
        }
      }
      
      console.error('All exchange rate sources failed. Using fallback rate.');
    };
    fetchExchangeRate();
  }, []);

  // Auto-scroll DaySelector
  useEffect(() => {
    if (daySelectorRef.current) {
      const selectedEl = daySelectorRef.current.querySelector(`[data-selected="true"]`);
      if (selectedEl) {
        const containerWidth = daySelectorRef.current.offsetWidth;
        const elOffset = (selectedEl as HTMLElement).offsetLeft;
        const elWidth = (selectedEl as HTMLElement).offsetWidth;
        
        daySelectorRef.current.scrollTo({
          left: elOffset - (containerWidth / 2) + (elWidth / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [selectedDayId]);

  useEffect(() => {
    localStorage.setItem('kyoto_travel_data_2026_v3', JSON.stringify(data));
  }, [data]);

  // Auto-scroll selected day into view
  const daySelectorRef = useRef<HTMLDivElement>(null);

  const deleteDay = (dayId: string) => {
    if (data.days.length <= 1) return;
    setData(prev => {
      const newDays = prev.days.filter(d => d.id !== dayId);
      return { ...prev, days: newDays };
    });
    if (selectedDayId === dayId) {
      const remainingDays = data.days.filter(d => d.id !== dayId);
      setSelectedDayId(remainingDays[0]?.id || '');
    }
  };

  const updateDayTitle = (dayId: string, newTitle: string) => {
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, title: newTitle } : d)
    }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setData((prev) => {
        const dayIndex = prev.days.findIndex(d => d.id === selectedDayId);
        if (dayIndex === -1) return prev;
        
        const oldIndex = prev.days[dayIndex].spots.findIndex(s => s.id === active.id);
        const newIndex = prev.days[dayIndex].spots.findIndex(s => s.id === over.id);
        
        const newDays = [...prev.days];
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          spots: arrayMove(newDays[dayIndex].spots, oldIndex, newIndex)
        };
        
        return { ...prev, days: newDays };
      });
    }
  };

  const addAiSuggestionToDay = (dayId: string) => {
    const insight = aiInsights[dayId];
    if (!insight) return;
    
    const newSpot: Spot = {
      id: Math.random().toString(36).substr(2, 9),
      time: '12:00',
      location: 'AI 建議景點',
      category: 'sightseeing',
      description: insight.substring(0, 200) + '...'
    };
    
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, spots: [...d.spots, newSpot] } : d)
    }));
  };

  const generateSpotInsight = async (dayId: string, spotId: string) => {
    const day = data.days.find(d => d.id === dayId);
    const spot = day?.spots.find(s => s.id === spotId);
    if (!spot || generatingSpotId) return;

    setGeneratingSpotId(spotId);
    try {
      const prompt = `你現在是一位專業的日本旅遊導遊，請根據我的行程名稱跟我介紹，如果分類是景點請介紹我我日文名稱，地址、關於此處的電話、營業時間、停留時間、門票價格、景點故事、旅遊攻略、附近美食；如果分類是美食請介紹這家店的日文名稱，地址、關於此處的電話、營業時間、停留時間、是否要預約、推薦菜單、店家故事；如果分類是購物請介紹我購物點的日文名稱，地址、關於此處的電話、營業時間、停留時間、購物攻略、附近美食；如果分類是交通請告訴我交通攻略、注意事項；並要能填入相對應的表格中。
      
      當前項目：
      名稱：${spot.location}
      分類：${CATEGORY_LABELS[spot.category]}
      描述：${spot.description}
      
      請提供以下資訊（繁體中文）：
      1. 日文名稱 (locationJp)
      2. 營業時間 (openingHours)
      3. 推薦菜單/必吃 (recommendedMenu)
      4. 門票/預算 (ticketPrice)
      5. 景點故事/簡介 (story)
      6. 旅遊攻略/備註 (notes)
      7. 綜合 AI 攻略建議 (aiInsight)
      8. 附近美食推薦 (nearbyFood) - 包含店名、Google Map 連結
      9. 電話 (phone)
      10. 停留時間 (stayDuration)
      11. 是否需要預約 (reservationRequired)
      
      請以 JSON 格式回傳。`;

      const ai = getAiInstance();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              locationJp: { type: "string" },
              openingHours: { type: "string" },
              recommendedMenu: { type: "string" },
              ticketPrice: { type: "string" },
              story: { type: "string" },
              notes: { type: "string" },
              aiInsight: { type: "string" },
              phone: { type: "string" },
              stayDuration: { type: "string" },
              reservationRequired: { type: "boolean" },
              nearbyFood: { 
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    mapUrl: { type: "string" },
                    image: { type: "string" }
                  }
                }
              },
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      updateSpot(dayId, spotId, result);
    } catch (error: any) {
      console.error("Spot AI Generation Error:", error);
      alert(error.message || "產生景點詳細資訊時出錯。");
    } finally {
      setGeneratingSpotId(null);
    }
  };

  const generateAiInsights = async (dayId: string) => {
    const day = data.days.find(d => d.id === dayId);
    if (!day || isGenerating) return;

    setIsGenerating(true);
    try {
      const prompt = `你是一位專業的日本導遊。請分析以下行程，並為每個景點提供簡短的故事、攻略、必吃美食、必點菜單、必買伴手禮。
      行程：${day.spots.map(s => `${s.time} ${s.location}: ${s.description}`).join(', ')}
      請使用 Markdown 格式，並將「必吃美食」、「必點菜單」、「必買伴手禮」、「重要預約代號」加粗並使用顯眼的標籤感。`;

      const ai = getAiInstance();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiInsights(prev => ({ ...prev, [dayId]: response.text || '無法生成建議。' }));
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      alert(error.message || "產生 AI 建議時出錯。");
    } finally {
      setIsGenerating(false);
    }
  };

  const addSpot = (dayId: string) => {
    const newSpot: Spot = {
      id: Math.random().toString(36).substr(2, 9),
      time: '12:00',
      location: '新景點',
      category: 'sightseeing',
      description: '點擊編輯描述'
    };
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, spots: [...d.spots, newSpot] } : d)
    }));
  };

  const updateSpot = (dayId: string, spotId: string, updates: Partial<Spot>) => {
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? {
        ...d,
        spots: d.spots.map(s => s.id === spotId ? { ...s, ...updates } : s)
      } : d)
    }));
  };

  const deleteSpot = (dayId: string, spotId: string) => {
    setData(prev => ({
      ...prev,
      days: prev.days.map(d => d.id === dayId ? { ...d, spots: d.spots.filter(s => s.id !== spotId) } : d)
    }));
  };

  const addExpense = () => {
    const newExpense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新支出',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      currency: 'JPY',
      paymentMethod: 'cash',
      category: 'other'
    };
    setData(prev => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
  };

  const addShoppingItem = () => {
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新商品',
      remarks: '',
      completed: false
    };
    setData(prev => ({ ...prev, shoppingList: [newItem, ...prev.shoppingList] }));
  };

  const toggleShoppingItem = (id: string) => {
    setData(prev => ({
      ...prev,
      shoppingList: prev.shoppingList.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    }));
  };

  const addConvenienceItem = () => {
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新商品',
      remarks: '',
      completed: false
    };
    setData(prev => ({ ...prev, convenienceStoreList: [newItem, ...prev.convenienceStoreList] }));
  };

  const toggleConvenienceItem = (id: string) => {
    setData(prev => ({
      ...prev,
      convenienceStoreList: prev.convenienceStoreList.map(item => item.id === id ? { ...item, completed: !item.completed } : item)
    }));
  };

  const addPackingItem = (category: PackingItem['category']) => {
    const newItem: PackingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新物品',
      quantity: 1,
      category,
      completed: false
    };
    setData(prev => ({ ...prev, packingList: [...prev.packingList, newItem] }));
  };

  const totalJpy = data.expenses.reduce((sum, e) => e.currency === 'JPY' ? sum + (e.amount || 0) : sum, 0);
  const totalTwd = data.expenses.reduce((sum, e) => e.currency === 'TWD' ? sum + (e.amount || 0) : sum, 0);
  const totalInTwd = totalTwd + (totalJpy * exchangeRate);

  return (
    <div className="min-h-screen bg-morandi-mist/20">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl relative overflow-x-hidden flex flex-col pb-28">
        {/* Travel Theme (Scrolls) */}
        <header className="p-6 pt-6 text-center space-y-2 bg-transparent">
        <div className="flex flex-col items-center justify-center">
          <input 
            className="text-[10px] font-bold text-fuji-blue uppercase tracking-[0.3em] mb-0.5 w-full text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-morandi-sage rounded px-2"
            value={data.subtitle || 'FAMILY TRIP'}
            onChange={e => setData(prev => ({ ...prev, subtitle: e.target.value }))}
            placeholder="FAMILY TRIP"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-2 relative">
              <div className="absolute left-[-80px]">
                <input 
                  className="w-16 h-9 rounded-xl border border-morandi-sand/30 flex items-center justify-center text-sm font-black text-morandi-clay focus:outline-none focus:border-morandi-sage text-center bg-white shadow-sm"
                  value={data.year || '2026'}
                  onChange={e => setData(prev => ({ ...prev, year: e.target.value }))}
                />
              </div>
              <input 
                className="bg-transparent border-none text-4xl font-serif text-fuji-blue focus:outline-none text-center w-auto min-w-[220px] font-black tracking-tight"
                value={data.title}
                onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="relative inline-block group">
          <div className="flex items-center bg-white border border-morandi-sand/20 px-4 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all">
            <Calendar size={12} className="text-morandi-sage mr-2" />
            <input 
              className="bg-transparent border-none text-[11px] font-black text-morandi-clay focus:outline-none text-center tracking-widest w-56"
              value={data.dateRange}
              onChange={e => setData(prev => ({ ...prev, dateRange: e.target.value }))}
            />
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="ml-2 text-morandi-sand hover:text-morandi-sage transition-colors"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          
          {showCalendar && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[100] bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 min-w-[280px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">設定旅行日期</h4>
                  <button onClick={() => setShowCalendar(false)} className="text-slate-400"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">出發日期</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border-none rounded-xl p-2 text-xs focus:outline-none"
                      onChange={e => {
                        const startDate = e.target.value;
                        if (startDate) {
                          const start = new Date(startDate);
                          const end = new Date(start);
                          end.setDate(start.getDate() + 5); // Default 6 days
                          
                          const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
                          const newDays: DayPlan[] = [];
                          for (let i = 0; i < 6; i++) {
                            const current = new Date(start);
                            current.setDate(start.getDate() + i);
                            const formattedDate = `${(current.getMonth() + 1).toString().padStart(2, '0')}.${current.getDate().toString().padStart(2, '0')} (${weekDays[current.getDay()]})`;
                            newDays.push({
                              id: `day${i + 1}`,
                              date: formattedDate,
                              title: `Day ${i + 1}`,
                              location: i === 0 ? '抵達' : '新地點',
                              spots: []
                            });
                          }
                          
                          const dateRangeStr = `${start.getFullYear()}/${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getDate().toString().padStart(2, '0')} – ${(end.getMonth() + 1).toString().padStart(2, '0')}/${end.getDate().toString().padStart(2, '0')} (${newDays.length}天${newDays.length - 1}夜)`;
                          
                          setData(prev => ({
                            ...prev,
                            dateRange: dateRangeStr,
                            days: newDays
                          }));
                          setSelectedDayId(newDays[0].id);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">結束日期</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border-none rounded-xl p-2 text-xs focus:outline-none"
                      onChange={e => {
                        const endDate = e.target.value;
                        if (endDate && data.days.length > 0) {
                          const [startMonth, startDay] = data.days[0].date.split(' ')[0].split('.').map(Number);
                          const start = new Date(parseInt(data.year), startMonth - 1, startDay);
                          const end = new Date(endDate);
                          
                          const diffTime = Math.abs(end.getTime() - start.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                          
                          const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
                          const newDays: DayPlan[] = [];
                          for (let i = 0; i < diffDays; i++) {
                            const current = new Date(start);
                            current.setDate(start.getDate() + i);
                            const formattedDate = `${(current.getMonth() + 1).toString().padStart(2, '0')}.${current.getDate().toString().padStart(2, '0')} (${weekDays[current.getDay()]})`;
                            
                            // Try to keep existing spots if within range
                            const existingDay = data.days[i];
                            newDays.push({
                              id: `day${i + 1}`,
                              date: formattedDate,
                              title: `Day ${i + 1}`,
                              location: existingDay?.location || '新地點',
                              spots: existingDay?.spots || []
                            });
                          }
                          
                          const dateRangeStr = `${start.getFullYear()}/${(start.getMonth() + 1).toString().padStart(2, '0')}/${start.getDate().toString().padStart(2, '0')} – ${(end.getMonth() + 1).toString().padStart(2, '0')}/${end.getDate().toString().padStart(2, '0')} (${newDays.length}天${newDays.length - 1}夜)`;
                          
                          setData(prev => ({
                            ...prev,
                            dateRange: dateRangeStr,
                            days: newDays
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
                <p className="text-[8px] text-slate-400 italic text-center">設定日期將自動更新每日行程表</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Sticky Day Selector */}
      <div className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-morandi-mist shadow-sm">
        <div 
          ref={daySelectorRef}
          className="flex overflow-x-auto px-4 py-3 gap-4 justify-start no-scrollbar max-w-sm mx-auto scroll-smooth"
        >
          {data.days.map(day => {
            const [datePart, dayPart] = day.date.split(' ');
            const dayNum = datePart.split('.')[1];
            const monthNum = datePart.split('.')[0];
            const weekDay = dayPart?.replace('(', '').replace(')', '') || '';
            const isSelected = selectedDayId === day.id;
            
            return (
              <div key={day.id} className="relative group flex-none" data-selected={isSelected}>
                <button
                  onClick={() => setSelectedDayId(day.id)}
                  className={cn(
                    "flex flex-col items-center transition-all relative p-2 px-4 rounded-2xl border-2 min-w-[60px]",
                    isSelected ? "bg-morandi-clay border-morandi-clay text-white shadow-md scale-105" : "border-morandi-mist bg-white text-morandi-sand hover:border-morandi-sand"
                  )}
                >
                  <span className="text-[10px] font-bold opacity-60 mb-0.5">
                    {weekDay}
                  </span>
                  <span className="text-sm font-black leading-none">
                    {monthNum}/{dayNum}
                  </span>
                </button>
                
                {/* Delete Day Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDay(day.id);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-50 text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-100"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <main className="p-5">
        <AnimatePresence mode="wait">
          {activeTab === 'daily' && (
            <motion.div 
              key="daily"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Selected Day Content */}
              {data.days.find(d => d.id === selectedDayId) && (
                <div className="space-y-4">
                  {/* Weather Info - Horizontal Hourly */}
                  <div className="space-y-6 px-6 py-8 bg-white rounded-[40px] border border-morandi-mist shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Sun className="text-orange-400" size={32} />
                        <div>
                          <h4 className="text-xl font-black text-morandi-clay leading-tight">京都市</h4>
                          <p className="text-[11px] font-bold text-morandi-ash uppercase tracking-widest">Kyoto City</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 text-sm font-bold text-morandi-ash">
                        <div className="flex items-center gap-2">
                          <Sunrise size={18} className="text-morandi-sage" />
                          <span>04:45</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sunset size={18} className="text-morandi-clay" />
                          <span>19:10</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-4 pb-3 no-scrollbar">
                      {(data.days.find(d => d.id === selectedDayId)?.weather?.hourly || Array.from({ length: 24 }).map((_, i) => ({
                        time: `${String(i).padStart(2, '0')}:00`,
                        temp: `${20 + Math.floor(Math.random() * 5)}°`,
                        icon: i > 6 && i < 18 ? <Sun size={16} /> : <Cloud size={16} />,
                        rainProb: `${Math.floor(Math.random() * 20)}%`
                      }))).map((h, i) => (
                        <div key={i} className="flex-none flex flex-col items-center gap-1.5 min-w-[55px] p-2 bg-slate-50/50 rounded-2xl">
                          <span className="text-[10px] text-morandi-ash font-mono font-bold">{h.time}</span>
                          <div className="text-morandi-blue">{h.icon}</div>
                          <span className="text-base font-mono font-black text-morandi-clay">{h.temp}</span>
                          <div className="flex items-center gap-0.5 text-[9px] font-black text-morandi-blue">
                            <CloudRain size={10} />
                            <span>{h.rainProb || '0%'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Insights Display */}
                  {aiInsights[selectedDayId] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-morandi-sage/10 p-6 rounded-[40px] border border-morandi-sage/20 space-y-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-morandi-clay font-black">
                          <Sparkles size={18} className="text-morandi-sage" />
                          <span>導遊建議與攻略</span>
                        </div>
                        <button 
                          onClick={() => addAiSuggestionToDay(selectedDayId)}
                          className="text-[10px] bg-white text-morandi-clay px-3 py-1.5 rounded-xl font-black flex items-center gap-1.5 border border-morandi-sand/20 shadow-sm hover:bg-morandi-mist transition-colors"
                        >
                          <Plus size={12} /> 加入行程
                        </button>
                      </div>
                      <div className="markdown-body text-sm text-morandi-clay leading-relaxed">
                        <ReactMarkdown>{aiInsights[selectedDayId]}</ReactMarkdown>
                      </div>
                    </motion.div>
                  )}

                  {/* Spots List with DND */}
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={data.days.find(d => d.id === selectedDayId)?.spots.map(s => s.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {/* Flight Info: Outbound on Day 1, Return on Last Day */}
                        {selectedDayId === data.days[0].id && data.flights.filter(f => f.type === 'departure').length > 0 && (
                          <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2 px-2">
                              <Plane size={14} />
                              <span>去程航班</span>
                            </div>
                            {data.flights
                              .filter(f => f.type === 'departure')
                              .map((flight, idx) => (
                                <BoardingPass 
                                  key={idx} 
                                  flight={flight} 
                                  onClick={() => {
                                    setSelectedFlight(flight);
                                    setShowFlightModal(true);
                                  }} 
                                  onDelete={() => setData(prev => ({ ...prev, flights: prev.flights.filter(f => f.id !== flight.id) }))}
                                />
                              ))}
                          </div>
                        )}

                        {data.days.find(d => d.id === selectedDayId)?.spots.map((spot, idx, arr) => (
                          <SortableSpot 
                            key={spot.id}
                            spot={spot}
                            dayId={selectedDayId}
                            updateSpot={updateSpot}
                            deleteSpot={deleteSpot}
                            onSpotClick={(dayId, spot) => {
                              setSelectedSpot({ dayId, spot });
                              setShowSpotModal(true);
                            }}
                            isLast={idx === arr.length - 1}
                            data={data}
                          />
                        ))}

                        {/* Day Notes removed as per request */}

                        {selectedDayId === data.days[data.days.length - 1].id && data.flights.filter(f => f.type === 'return').length > 0 && (
                          <div className="space-y-4 mt-8">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2 px-2">
                              <Plane size={14} />
                              <span>回程航班</span>
                            </div>
                            {data.flights
                              .filter(f => f.type === 'return')
                              .map((flight, idx) => (
                                <BoardingPass 
                                  key={idx} 
                                  flight={flight} 
                                  onClick={() => {
                                    setSelectedFlight(flight);
                                    setShowFlightModal(true);
                                  }} 
                                  onDelete={() => setData(prev => ({ ...prev, flights: prev.flights.filter(f => f.id !== flight.id) }))}
                                />
                              ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-center pt-4 gap-4">
                          <button 
                            onClick={() => generateAiInsights(selectedDayId)}
                            disabled={isGenerating}
                            className="w-12 h-12 bg-morandi-sage/10 text-morandi-sage rounded-full flex items-center justify-center hover:bg-morandi-sage/20 transition-all disabled:opacity-50 shadow-sm border border-morandi-sage/20"
                            title="AI 攻略"
                          >
                            <Sparkles size={20} className={isGenerating ? "animate-pulse" : ""} />
                          </button>
                          <button 
                            onClick={() => addSpot(selectedDayId)}
                            className="w-12 h-12 border-2 border-dashed border-morandi-sand/30 rounded-full text-morandi-sand flex items-center justify-center hover:bg-white hover:border-morandi-sage hover:text-morandi-sage transition-all shadow-sm"
                            title="新增景點"
                          >
                            <Plus size={24} />
                          </button>
                        </div>
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div 
              key="billing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Cloud Sync Status */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 text-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
                      <Cloud size={20} className={user ? "text-kyoto-gold" : "text-slate-300"} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">雲端記帳</p>
                      <p className="text-sm font-bold">{user ? `${user.email}` : '尚未連線'}</p>
                    </div>
                  </div>
                  {user ? (
                    <button 
                      onClick={logout}
                      className="bg-slate-50 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      登出
                    </button>
                  ) : (
                    <button 
                      onClick={signIn}
                      className="bg-kyoto-gold text-slate-900 px-4 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-2 hover:bg-slate-800 hover:text-white transition-all"
                    >
                      Google 登入
                    </button>
                  )}
                </div>

                {user && (
                  <div className="pt-4 border-t border-slate-50 space-y-4">
                    {!currentTripId ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={handleCreateShareTrip}
                          className="bg-slate-800 text-white p-4 rounded-2xl text-xs font-black flex flex-col items-center gap-2 hover:bg-slate-700 transition-all"
                        >
                          <Share2 size={20} className="text-kyoto-gold" />
                          建立共享
                        </button>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
                          <input 
                            type="text" 
                            placeholder="輸入共享 ID"
                            className="w-full bg-white border-none text-center text-xs font-bold p-2 rounded-lg focus:outline-none"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleJoinTrip(e.currentTarget.value.trim().toUpperCase());
                            }}
                          />
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">按 Enter 加入</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-800 rounded-2xl p-4 text-white">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">共享行程 ID</p>
                          <button 
                            onClick={handleExitTrip}
                            className="bg-white/10 px-2 py-1 rounded-lg text-[9px] font-bold hover:bg-white/20"
                          >
                            退出共享
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-black tracking-widest text-kyoto-gold">{currentTripId}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(currentTripId);
                              alert('ID 已複製！請傳送給旅伴');
                            }}
                            className="bg-kyoto-gold text-slate-900 p-2 rounded-xl hover:scale-105 transition-transform"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                        <p className="text-[10px] font-bold text-white/50 mt-3 flex items-center gap-2">
                          <Users size={12} />
                          多人共享模式已開啟
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-100 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-kyoto-matcha" />
                    <span className="font-bold text-sm text-slate-700">匯率換算器</span>
                  </div>
                  <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-full">VISA: {exchangeRate}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-black text-morandi-ash uppercase tracking-widest block px-1">JPY ¥</span>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <input 
                        type="number"
                        className="w-full bg-transparent border-none p-0 text-xl font-black text-morandi-clay focus:outline-none"
                        placeholder="0"
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const twdInput = document.getElementById('twd-input') as HTMLInputElement;
                          if (twdInput) twdInput.value = Math.round(val * exchangeRate).toString();
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-none pt-6">
                    <ArrowRightLeft size={16} className="text-morandi-sand" />
                  </div>

                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-black text-morandi-ash uppercase tracking-widest block px-1">TWD $</span>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <input 
                        id="twd-input"
                        type="number"
                        className="w-full bg-transparent border-none p-0 text-xl font-black text-morandi-clay focus:outline-none"
                        placeholder="0"
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const jpyInput = document.querySelector('input[placeholder="0"]') as HTMLInputElement;
                          if (jpyInput) jpyInput.value = Math.round(val / exchangeRate).toString();
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Card with Chart */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowExpenseChartModal(true)}
                className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 space-y-4 cursor-pointer group"
              >
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">總支出 (點擊查看圖表)</p>
                  <h2 className="text-3xl font-black text-slate-800">
                    <span className="text-lg mr-1">TWD $</span>
                    {totalTwd.toLocaleString()}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    約 JPY ¥ {totalJpy.toLocaleString()}
                  </p>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExpenseModal(true);
                  }}
                  className="w-full bg-kyoto-matcha text-white py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Plus size={16} />
                  <span>新增支出項目</span>
                </button>
              </motion.div>

      <AnimatePresence>
        {showTransportModal && selectedTransportOrder && (
          <TransportEditModal 
            selectedOrder={selectedTransportOrder}
            onClose={() => {
              setShowTransportModal(false);
              setSelectedTransportOrder(null);
            }}
            onUpdate={(updated) => {
              setData(prev => ({
                ...prev,
                transportOrders: prev.transportOrders.map(o => o.id === updated.id ? updated : o),
                days: prev.days.map(d => ({
                  ...d,
                  spots: d.spots.map(s => (s.category === 'transport' && s.location === updated.name) ? {
                    ...s,
                    time: updated.time || s.time,
                    notes: updated.remarks || s.notes
                  } : s)
                }))
              }));
            }}
            setData={setData}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showExpenseModal && (
          <ExpenseModal 
            expenseToEdit={selectedExpense}
            onClose={() => {
              setShowExpenseModal(false);
              setSelectedExpense(null);
            }}
            onAdd={(expense) => {
              handleAddExpense(expense);
              setShowExpenseModal(false);
              setSelectedExpense(null);
            }}
            exchangeRate={exchangeRate}
            expenseCurrency={expenseCurrency}
            setExpenseCurrency={setExpenseCurrency}
          />
        )}
      </AnimatePresence>
              {/* Expense Chart Modal */}
              <AnimatePresence>
                {showExpenseChartModal && (
                  <div className="fixed inset-0 z-[110] flex items-center justify-center p-5">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowExpenseChartModal(false)}
                      className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-800">支出分析</h3>
                        <button onClick={() => setShowExpenseChartModal(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                        </button>
                      </div>

                      {data.expenses.length > 0 ? (
                        <div className="space-y-6">
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={Object.entries(
                                    data.expenses.reduce((acc, exp) => {
                                      const amountInTwd = exp.currency === 'JPY' ? exp.amount * exchangeRate : exp.amount;
                                      acc[exp.category] = (acc[exp.category] || 0) + amountInTwd;
                                      return acc;
                                    }, {} as Record<string, number>)
                                  ).map(([cat, amount]) => ({
                                    name: EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory],
                                    value: amount
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {Object.keys(EXPENSE_CATEGORY_LABELS).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={['#A8B5A2', '#C5C9C0', '#E2E4DF', '#D1D5DB', '#9CA3AF', '#6B7280'][index % 6]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  contentStyle={{ fontSize: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                                />
                                <Legend 
                                  verticalAlign="bottom" 
                                  height={36}
                                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(
                              data.expenses.reduce((acc, exp) => {
                                const amountInTwd = exp.currency === 'JPY' ? exp.amount * exchangeRate : exp.amount;
                                acc[exp.category] = (acc[exp.category] || 0) + amountInTwd;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([cat, amount]) => (
                              <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-600">{EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory]}</span>
                                <span className="text-xs font-black text-slate-800">TWD $ {Math.round(amount || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-center space-y-2">
                          <Wallet size={48} className="mx-auto text-slate-100" />
                          <p className="text-sm text-slate-400 font-bold">尚無支出紀錄</p>
                        </div>
                      )}

                      <button 
                        onClick={() => setShowExpenseChartModal(false)}
                        className="w-full bg-slate-800 text-white py-3 rounded-2xl font-bold text-sm"
                      >
                        關閉
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Expense List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-slate-700">消費明細</h3>
                </div>
                {data.expenses.map(expense => (
                  <div 
                    key={expense.id} 
                    onClick={() => {
                      setSelectedExpense(expense);
                      setExpenseCurrency(expense.currency);
                      setShowExpenseModal(true);
                    }}
                    className="bg-white p-4 rounded-3xl shadow-xs border border-slate-100 flex items-center gap-4 group cursor-pointer hover:border-morandi-sand/30 transition-all"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                      {expense.category === 'food' && <Utensils size={20} />}
                      {expense.category === 'transport' && <Bus size={20} />}
                      {expense.category === 'hotel' && <Hotel size={20} />}
                      {expense.category === 'shopping' && <ShoppingBag size={20} />}
                      {expense.category === 'ticket' && <Ticket size={20} />}
                      {expense.category === 'other' && <Info size={20} />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-slate-800">{expense.name}</p>
                      <p className="text-[10px] text-slate-400">{expense.date} · {EXPENSE_CATEGORY_LABELS[expense.category]}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-slate-800">{expense.currency === 'JPY' ? 'JPY ¥' : 'TWD $'} {(expense.amount || 0).toLocaleString()}</p>
                      {expense.currency === 'JPY' && (
                        <p className="text-[10px] text-slate-400">≈ TWD $ {Math.round((expense.amount || 0) * exchangeRate).toLocaleString()}</p>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteExpense(expense.id);
                      }}
                      className="text-slate-200 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'shopping' && (
            <motion.div 
              key="shopping"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-10"
            >
              {/* Shopping List Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif text-slate-800">購物清單</h2>
                  <button 
                    onClick={addShoppingItem}
                    className="w-10 h-10 bg-kyoto-matcha text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-slate-700 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {data.shoppingList.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setSelectedShoppingItem({ id: item.id, listType: 'shopping' });
                        setShowShoppingModal(true);
                      }}
                      className={cn(
                        "bg-white p-3 rounded-3xl shadow-xs border transition-all flex flex-col gap-3 relative group cursor-pointer",
                        item.completed ? "opacity-60 border-transparent" : "border-slate-100"
                      )}
                    >
                      <div className="w-full aspect-square bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 relative overflow-hidden group/img">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Camera size={24} />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setData(prev => ({
                                  ...prev,
                                  shoppingList: prev.shoppingList.map(i => i.id === item.id ? { ...i, image: reader.result as string } : i)
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <textarea 
                            className={cn("font-bold text-sm w-full bg-transparent border-none focus:outline-none leading-tight resize-none h-10", item.completed && "line-through")}
                            value={item.name}
                            onChange={e => setData(prev => ({
                              ...prev,
                              shoppingList: prev.shoppingList.map(i => i.id === item.id ? { ...i, name: e.target.value } : i)
                            }))}
                          />
                          <button 
                            onClick={() => toggleShoppingItem(item.id)}
                            className={cn("transition-colors flex-none", item.completed ? "text-kyoto-matcha" : "text-slate-200")}
                          >
                            {item.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>
                        </div>
                        <textarea 
                          className="text-[10px] text-slate-400 w-full bg-transparent border-none focus:outline-none resize-none h-8 leading-tight"
                          placeholder="備註..."
                          value={item.remarks}
                          onChange={e => setData(prev => ({
                            ...prev,
                            shoppingList: prev.shoppingList.map(i => i.id === item.id ? { ...i, remarks: e.target.value } : i)
                          }))}
                        />
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setData(prev => ({ ...prev, shoppingList: prev.shoppingList.filter(i => i.id !== item.id) }));
                        }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Convenience Store Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif text-slate-800">超商推薦清單</h2>
                  <button 
                    onClick={addConvenienceItem}
                    className="w-10 h-10 bg-morandi-blue text-white rounded-xl flex items-center justify-center shadow-lg hover:opacity-90 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {data.convenienceStoreList.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setSelectedShoppingItem({ id: item.id, listType: 'convenience' });
                        setShowShoppingModal(true);
                      }}
                      className={cn(
                        "bg-white p-3 rounded-3xl shadow-xs border transition-all flex flex-col gap-3 relative group cursor-pointer",
                        item.completed ? "opacity-60 border-transparent" : "border-slate-100"
                      )}
                    >
                      <div className="w-full aspect-square bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 relative overflow-hidden group/img">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Camera size={24} />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setData(prev => ({
                                  ...prev,
                                  convenienceStoreList: prev.convenienceStoreList.map(i => i.id === item.id ? { ...i, image: reader.result as string } : i)
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <textarea 
                            className={cn("font-bold text-sm w-full bg-transparent border-none focus:outline-none leading-tight resize-none h-10", item.completed && "line-through")}
                            value={item.name}
                            onChange={e => setData(prev => ({
                              ...prev,
                              convenienceStoreList: prev.convenienceStoreList.map(i => i.id === item.id ? { ...i, name: e.target.value } : i)
                            }))}
                          />
                          <button 
                            onClick={() => toggleConvenienceItem(item.id)}
                            className={cn("transition-colors flex-none", item.completed ? "text-morandi-blue" : "text-slate-200")}
                          >
                            {item.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </button>
                        </div>
                        <textarea 
                          className="text-[10px] text-slate-400 w-full bg-transparent border-none focus:outline-none resize-none h-8 leading-tight"
                          placeholder="備註..."
                          value={item.remarks}
                          onChange={e => setData(prev => ({
                            ...prev,
                            convenienceStoreList: prev.convenienceStoreList.map(i => i.id === item.id ? { ...i, remarks: e.target.value } : i)
                          }))}
                        />
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setData(prev => ({ ...prev, convenienceStoreList: prev.convenienceStoreList.filter(i => i.id !== item.id) }));
                        }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'guide' && (
            <motion.div 
              key="guide"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Travel Documents */}
              <div className="space-y-8">
                {/* Flight Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-morandi-blue flex items-center gap-2">
                      <Plane size={20} className="text-morandi-blue" />
                      航班資訊
                    </h3>
                    <button 
                      onClick={() => {
                        const newFlight: FlightInfo = {
                          id: Math.random().toString(36).substr(2, 9),
                          type: 'departure',
                          airline: '航空公司',
                          flightNumber: '航班號',
                          departureAirport: 'TPE',
                          arrivalAirport: 'KIX',
                          departureTime: '00:00',
                          arrivalTime: '00:00',
                        };
                        setData(prev => ({ ...prev, flights: [...prev.flights, newFlight] }));
                        setSelectedFlight(newFlight);
                        setShowFlightModal(true);
                      }}
                      className="text-morandi-blue hover:scale-110 transition-transform"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Departure */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">去程航班</p>
                      <div className="grid gap-4">
                        {data.flights.filter(f => f.type === 'departure').map(f => (
                          <BoardingPass 
                            key={f.id} 
                            flight={f} 
                            onClick={() => {
                              setSelectedFlight(f);
                              setShowFlightModal(true);
                            }} 
                            onDelete={() => setData(prev => ({ ...prev, flights: prev.flights.filter(fl => fl.id !== f.id) }))}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Transit */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">中轉航班</p>
                      <div className="grid gap-4">
                        {data.flights.filter(f => f.type === 'transit').map(f => (
                          <BoardingPass 
                            key={f.id} 
                            flight={f} 
                            onClick={() => {
                              setSelectedFlight(f);
                              setShowFlightModal(true);
                            }} 
                            onDelete={() => setData(prev => ({ ...prev, flights: prev.flights.filter(fl => fl.id !== f.id) }))}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Return */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">回程航班</p>
                      <div className="grid gap-4">
                        {data.flights.filter(f => f.type === 'return').map(f => (
                          <BoardingPass 
                            key={f.id} 
                            flight={f} 
                            onClick={() => {
                              setSelectedFlight(f);
                              setShowFlightModal(true);
                            }} 
                            onDelete={() => setData(prev => ({ ...prev, flights: prev.flights.filter(fl => fl.id !== f.id) }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hotel Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-morandi-clay flex items-center gap-2">
                      <Bed size={20} className="text-morandi-clay" />
                      住宿資訊
                    </h3>
                    <button 
                      onClick={() => {
                        const newHotel = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: '飯店名稱',
                          address: '飯店地址',
                          checkIn: '06/05',
                          checkOut: '06/06',
                        };
                        setData(prev => ({ ...prev, hotels: [...prev.hotels, newHotel] }));
                        setSelectedHotel(newHotel);
                        setShowHotelModal(true);
                      }}
                      className="text-morandi-clay hover:scale-110 transition-transform"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {data.hotels.map(h => (
                      <motion.div 
                        key={h.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          setSelectedHotel(h);
                          setShowHotelModal(true);
                        }}
                        className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 cursor-pointer group relative"
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setData(prev => ({ ...prev, hotels: prev.hotels.filter(hotel => hotel.id !== h.id) }));
                          }}
                          className="absolute top-3 right-3 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                        
                        <div className="flex gap-4">
                          <div className="bg-morandi-clay/10 w-12 h-12 rounded-2xl flex-none flex items-center justify-center text-morandi-clay group-hover:bg-morandi-clay group-hover:text-white transition-colors">
                            <Bed size={24} />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-black text-slate-800 text-base">{h.name}</h4>
                            <div className="flex flex-col gap-1">
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.address)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs text-slate-400 font-medium flex items-center gap-1 hover:text-morandi-clay transition-colors"
                              >
                                <MapPin size={10} />
                                <span className="underline underline-offset-2">{h.address}</span>
                              </a>
                              {h.phone && (
                                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                  <Phone size={10} />
                                  {h.phone}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2">
                              {h.remarks && (
                                <p className="text-[10px] text-morandi-clay font-bold w-full bg-morandi-sand/10 px-2 py-1 rounded-lg">
                                  備註: {h.remarks}
                                </p>
                              )}
                              <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg flex items-center gap-2">
                                <span>入住: {h.checkIn}</span>
                                <span className="text-slate-300">|</span>
                                <span>退房: {h.checkOut}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Transport Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-morandi-clay flex items-center gap-2">
                      <Bus size={20} className="text-morandi-clay" />
                      交通&其它資訊
                    </h3>
                    <button 
                      onClick={() => {
                        const newOrder = { 
                          id: Math.random().toString(36).substr(2, 9), 
                          name: '新交通&其它資訊',
                          date: '06/05',
                          time: '00:00',
                          location: '地點',
                          remarks: ''
                        };
                        setData(prev => ({ ...prev, transportOrders: [...prev.transportOrders, newOrder] }));
                        setSelectedTransportOrder(newOrder);
                        setShowTransportModal(true);
                      }}
                      className="text-morandi-clay hover:scale-110 transition-transform"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {data.transportOrders.map(order => (
                      <motion.div 
                        key={order.id} 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedTransportOrder(order);
                          setShowTransportModal(true);
                        }}
                        className="bg-white p-5 rounded-3xl border border-morandi-sand/20 flex items-center justify-between shadow-sm group relative cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-morandi-mist flex items-center justify-center text-morandi-clay">
                            <Ticket size={20} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-morandi-clay">{order.name}</h4>
                            <div className="flex items-center gap-2">
                              {order.date && <p className="text-[10px] font-bold text-morandi-ash">{order.date}</p>}
                              <p className="text-[10px] font-bold text-morandi-ash">{order.location}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-black text-morandi-clay">{order.time}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setData(prev => ({ ...prev, transportOrders: prev.transportOrders.filter(o => o.id !== order.id) }));
                          }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-50 text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-100"
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Visit Japan Web Card - VJW Style */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative bg-[#1a1a1a] rounded-3xl p-5 overflow-hidden shadow-lg group border border-white/5 cursor-pointer"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#b33a3a]" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="inline-block bg-[#b33a3a] text-white text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase">Must Have</span>
                      <h3 className="text-lg font-black text-white tracking-tight">Visit Japan Web</h3>
                      <p className="text-[10px] text-slate-400 font-medium">日本入境審查及海關申報</p>
                    </div>
                    <a 
                      href="https://vjw-lp.digital.go.jp/" 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </motion.div>

                {/* Emergency Contacts Section */}
                <div className="space-y-4">
                  <div className="px-2">
                    <h3 className="text-xl font-black text-[#b33a3a] flex items-center gap-2 tracking-tight uppercase">
                      <Phone size={20} />
                      緊急聯絡資訊
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center space-y-0.5">
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">警察</p>
                      <p className="text-xl font-mono text-[#b33a3a] font-black">110</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center space-y-0.5">
                      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">救護 / 火警</p>
                      <p className="text-xl font-mono text-[#b33a3a] font-black">119</p>
                    </div>
                  </div>

                  {/* JNTO Hotline */}
                  <div className="bg-[#1a1a1a] p-5 rounded-3xl shadow-lg relative overflow-hidden group border border-white/5">
                    <div className="relative z-10 space-y-3">
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-bold text-[#b33a3a] uppercase tracking-[0.2em]">Japan Visitor Hotline</p>
                        <h4 className="text-base font-black text-white leading-tight">訪日外國人醫療 & 急難熱線</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-serif font-black text-white tracking-wider">050-3816-2787</p>
                        <div className="w-10 h-10 rounded-full bg-[#b33a3a] flex items-center justify-center text-white shadow-lg">
                          <Phone size={18} />
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 font-medium leading-relaxed">* 24小時對應 (英/中/韓)。</p>
                    </div>
                  </div>

                  {/* Representative Office */}
                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider">駐日機構</span>
                      <h4 className="text-base font-black text-slate-800">台北駐福岡經濟文化辦事處</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl space-y-1.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">上班時間</p>
                        <p className="text-sm font-mono text-slate-800 font-black">092-734-2810</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-2xl space-y-1.5">
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">急難救助</p>
                        <p className="text-sm font-mono text-red-600 font-black">090-1922-9740</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Packing List Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-kyoto-matcha flex items-center gap-2">
                    <Luggage size={20} className="text-kyoto-matcha" />
                    行李打包清單
                  </h3>
                  
                  {(['carry-on', 'checked'] as const).map(cat => (
                    <div key={cat} className="bg-white p-5 rounded-3xl shadow-xs border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          {cat === 'carry-on' ? '隨身行李' : '托運行李'}
                        </span>
                        <button onClick={() => addPackingItem(cat)} className="text-kyoto-matcha"><Plus size={16} /></button>
                      </div>
                      <div className="space-y-3">
                        {data.packingList.filter(p => p.category === cat).map(item => (
                          <div key={item.id} className="flex items-center gap-3">
                            <button 
                              onClick={() => setData(prev => ({
                                ...prev,
                                packingList: prev.packingList.map(p => p.id === item.id ? { ...p, completed: !p.completed } : p)
                              }))}
                              className={cn("transition-colors", item.completed ? "text-kyoto-matcha" : "text-slate-200")}
                            >
                              {item.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </button>
                            <input 
                              className={cn("flex-1 text-sm bg-transparent border-none focus:outline-none", item.completed && "line-through text-slate-300")}
                              value={item.name}
                              onChange={e => setData(prev => ({
                                ...prev,
                                packingList: prev.packingList.map(p => p.id === item.id ? { ...p, name: e.target.value } : p)
                              }))}
                            />
                            <input 
                              type="number"
                              className="w-8 text-center text-xs font-bold text-slate-400 bg-slate-50 rounded"
                              value={item.quantity}
                              onChange={e => setData(prev => ({
                                ...prev,
                                packingList: prev.packingList.map(p => p.id === item.id ? { ...p, quantity: parseInt(e.target.value) || 0 } : p)
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Spot Detail Modal */}
      <AnimatePresence>
        {showTransportModal && selectedTransportOrder && (
          <TransportEditModal 
            selectedOrder={selectedTransportOrder}
            onClose={() => {
              setShowTransportModal(false);
              setSelectedTransportOrder(null);
            }}
            onUpdate={(updated) => {
              setData(prev => ({
                ...prev,
                transportOrders: prev.transportOrders.map(o => o.id === updated.id ? updated : o),
                days: prev.days.map(d => ({
                  ...d,
                  spots: d.spots.map(s => (s.category === 'transport' && s.location === updated.name) ? {
                    ...s,
                    time: updated.time || s.time,
                    notes: updated.remarks || s.notes
                  } : s)
                }))
              }));
            }}
            setData={setData}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showExpenseModal && (
          <ExpenseModal 
            expenseToEdit={selectedExpense}
            onClose={() => {
              setShowExpenseModal(false);
              setSelectedExpense(null);
            }}
            onAdd={(expense) => {
              handleAddExpense(expense);
              setShowExpenseModal(false);
              setSelectedExpense(null);
            }}
            exchangeRate={exchangeRate}
            expenseCurrency={expenseCurrency}
            setExpenseCurrency={setExpenseCurrency}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showExpenseChartModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExpenseChartModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800">支出分析</h3>
                <button onClick={() => setShowExpenseChartModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              {data.expenses.length > 0 ? (
                <div className="space-y-6">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            data.expenses.reduce((acc, exp) => {
                              const amountInTwd = exp.currency === 'JPY' ? exp.amount * exchangeRate : exp.amount;
                              acc[exp.category] = (acc[exp.category] || 0) + amountInTwd;
                              return acc;
                            }, {} as Record<string, number>)
                          ).map(([cat, amount]) => ({
                            name: EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory],
                            value: amount
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {Object.keys(EXPENSE_CATEGORY_LABELS).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#8B9D83', '#C1A191', '#92A8D1', '#F7CAC9', '#D5A6BD', '#B1BACE'][index % 6]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(
                      data.expenses.reduce((acc, exp) => {
                        const amountInTwd = exp.currency === 'JPY' ? exp.amount * exchangeRate : exp.amount;
                        acc[exp.category] = (acc[exp.category] || 0) + amountInTwd;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([cat, amount], idx) => (
                      <div key={cat} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#8B9D83', '#C1A191', '#92A8D1', '#F7CAC9', '#D5A6BD', '#B1BACE'][idx % 6] }} />
                        <span className="text-[10px] font-bold text-slate-500">{EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory]}</span>
                        <span className="text-[10px] font-black text-slate-800 ml-auto">${Math.round(amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                    <Wallet size={32} />
                  </div>
                  <p className="text-sm font-bold text-slate-400">尚無支出資料</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSpotModal && selectedSpot && (
          <SpotEditModal 
            selectedSpot={selectedSpot}
            onClose={() => setShowSpotModal(false)}
            onUpdate={(updates) => updateSpot(selectedSpot.dayId, selectedSpot.spot.id, updates)}
            onDelete={() => {
              deleteSpot(selectedSpot.dayId, selectedSpot.spot.id);
              setShowSpotModal(false);
            }}
            onGenerateInsight={() => generateSpotInsight(selectedSpot.dayId, selectedSpot.spot.id)}
            isGenerating={generatingSpotId === selectedSpot.spot.id}
            setActiveTab={setActiveTab}
            data={data}
            setData={setData}
          />
        )}
      </AnimatePresence>

      {/* Shopping Edit Modal */}
      <AnimatePresence>
        {showShoppingModal && selectedShoppingItem && (
          <ShoppingEditModal 
            item={
              selectedShoppingItem.listType === 'shopping' 
                ? data.shoppingList.find(i => i.id === selectedShoppingItem.id)!
                : data.convenienceStoreList.find(i => i.id === selectedShoppingItem.id)!
            }
            onClose={() => {
              setShowShoppingModal(false);
              setSelectedShoppingItem(null);
            }}
            onUpdate={(updated) => {
              setData(prev => ({
                ...prev,
                [selectedShoppingItem.listType === 'shopping' ? 'shoppingList' : 'convenienceStoreList']: 
                  prev[selectedShoppingItem.listType === 'shopping' ? 'shoppingList' : 'convenienceStoreList'].map(i => i.id === updated.id ? updated : i)
              }));
            }}
            onDelete={() => {
              setData(prev => ({
                ...prev,
                [selectedShoppingItem.listType === 'shopping' ? 'shoppingList' : 'convenienceStoreList']: 
                  prev[selectedShoppingItem.listType === 'shopping' ? 'shoppingList' : 'convenienceStoreList'].filter(i => i.id !== selectedShoppingItem.id)
              }));
              setShowShoppingModal(false);
              setSelectedShoppingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Flight Edit Modal */}
      <AnimatePresence>
        {showFlightModal && selectedFlight && (
          <FlightEditModal 
            selectedFlight={selectedFlight}
            onClose={() => setShowFlightModal(false)}
            onUpdate={(updated) => {
              setSelectedFlight(updated);
              setData(prev => ({ ...prev, flights: prev.flights.map(f => f.id === updated.id ? updated : f) }));
            }}
            setData={setData}
          />
        )}
      </AnimatePresence>

      {/* Hotel Edit Modal */}
      <AnimatePresence>
        {showHotelModal && selectedHotel && (
          <HotelEditModal 
            selectedHotel={selectedHotel}
            onClose={() => setShowHotelModal(false)}
            onUpdate={(updated) => {
              setSelectedHotel(updated);
              setData(prev => ({
                ...prev,
                hotels: prev.hotels.map(h => h.id === updated.id ? updated : h),
                days: prev.days.map(d => ({
                  ...d,
                  spots: d.spots.map(s => (s.category === 'hotel' && s.location === updated.name) ? {
                    ...s,
                    address: updated.address,
                    phone: updated.phone || s.phone
                  } : s)
                }))
              }));
            }}
            setData={setData}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCalendar && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalendar(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800">選擇日期</h3>
                <button onClick={() => setShowCalendar(false)} className="text-slate-400">
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <span key={d} className="text-[10px] font-bold text-slate-300 uppercase py-2">{d}</span>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setShowCalendar(false)}
                    className="aspect-square flex items-center justify-center rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-400 text-center font-medium">目前僅支援手動輸入日期範圍於標題下方</p>
                <button 
                  onClick={() => setShowCalendar(false)}
                  className="w-full bg-kyoto-matcha text-white py-3 rounded-2xl font-bold"
                >
                  確定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] h-20 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 flex items-center justify-around px-4 z-50">
        <button 
          onClick={() => setActiveTab('daily')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'daily' ? "text-morandi-sage scale-110" : "text-morandi-sand")}
        >
          <Calendar size={24} />
          <span className="text-[10px] font-bold">每日行程</span>
        </button>
        <button 
          onClick={() => setActiveTab('billing')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'billing' ? "text-morandi-sage scale-110" : "text-morandi-sand")}
        >
          <Wallet size={24} />
          <span className="text-[10px] font-bold">記帳匯率</span>
        </button>
        <button 
          onClick={() => setActiveTab('guide')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'guide' ? "text-morandi-sage scale-110" : "text-morandi-sand")}
        >
          <MapIcon size={24} />
          <span className="text-[10px] font-bold">指南</span>
        </button>
        <button 
          onClick={() => setActiveTab('shopping')}
          className={cn("flex flex-col items-center gap-1 transition-all", activeTab === 'shopping' ? "text-morandi-sage scale-110" : "text-morandi-sand")}
        >
          <ShoppingBag size={24} />
          <span className="text-[10px] font-bold">購物清單</span>
        </button>
      </nav>
      </div> {/* End of max-w-md container */}
    </div>
  );
}

function ExpenseModal({ 
  expenseToEdit,
  onClose, 
  onAdd,
  exchangeRate,
  expenseCurrency,
  setExpenseCurrency
}: { 
  expenseToEdit?: Expense | null;
  onClose: () => void; 
  onAdd: (expense: Expense) => void;
  exchangeRate: number;
  expenseCurrency: 'JPY' | 'TWD';
  setExpenseCurrency: (curr: 'JPY' | 'TWD') => void;
}) {
  const [name, setName] = useState(expenseToEdit?.name || '');
  const [amount, setAmount] = useState(expenseToEdit?.amount.toString() || '');
  const [date, setDate] = useState(expenseToEdit?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>(expenseToEdit?.paymentMethod || 'cash');
  const [category, setCategory] = useState<ExpenseCategory>(expenseToEdit?.category || 'other');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-5">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-[320px] rounded-[32px] shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-morandi-sand/10">
          <h3 className="text-xl font-black text-slate-800">{expenseToEdit ? '編輯支出' : '新增支出'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-morandi-ash uppercase tracking-widest px-1">日期</label>
            <input 
              type="date" 
              className="w-full bg-morandi-mist border border-morandi-sand/20 rounded-xl p-3 focus:outline-none text-xs text-morandi-clay font-bold appearance-none" 
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <label className="text-[9px] font-bold text-morandi-ash uppercase tracking-widest">金額</label>
              <div className="flex bg-morandi-mist p-0.5 rounded-lg border border-morandi-sand/10">
                {['JPY', 'TWD'].map(curr => (
                  <button
                    key={curr}
                    onClick={() => setExpenseCurrency(curr === 'JPY' ? 'JPY' : 'TWD')}
                    className={cn(
                      "px-2 py-0.5 text-[8px] font-black rounded-md transition-all",
                      expenseCurrency === curr ? "bg-morandi-clay text-white shadow-sm" : "text-morandi-ash"
                    )}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-morandi-mist border border-morandi-sand/20 rounded-2xl p-4">
              <input 
                type="number" 
                className="flex-1 bg-transparent border-none focus:outline-none text-2xl font-black text-morandi-clay" 
                placeholder="0" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <span className="text-lg font-black text-morandi-ash/40">
                {expenseCurrency === 'JPY' ? '¥' : '$'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-morandi-ash uppercase tracking-widest px-1">支付方式</label>
              <select 
                className="w-full bg-morandi-mist border border-morandi-sand/20 rounded-xl p-3 focus:outline-none appearance-none text-xs font-bold text-morandi-clay"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as 'cash' | 'credit')}
              >
                <option value="cash">現金</option>
                <option value="credit">刷卡</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-morandi-ash uppercase tracking-widest px-1">分類</label>
              <select 
                className="w-full bg-morandi-mist border border-morandi-sand/20 rounded-xl p-3 focus:outline-none appearance-none text-xs font-bold text-morandi-clay"
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-morandi-ash uppercase tracking-widest px-1">項目名稱</label>
            <input 
              className="w-full bg-morandi-mist border border-morandi-sand/20 rounded-xl p-3 focus:outline-none text-xs text-morandi-clay font-bold" 
              placeholder="例如：一蘭拉麵" 
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => {
              const parsedAmount = parseFloat(amount) || 0;
              if (name && parsedAmount > 0) {
                onAdd({
                  id: expenseToEdit?.id || Math.random().toString(36).substr(2, 9),
                  name,
                  date,
                  amount: parsedAmount,
                  currency: expenseCurrency,
                  paymentMethod,
                  category,
                  notes: expenseToEdit?.notes || ''
                });
              }
            }}
            className="w-full bg-morandi-clay text-white py-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition-opacity text-[10px] uppercase tracking-widest mt-2"
          >
            {expenseToEdit ? '確認修改' : '確認新增'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ShoppingEditModal({ 
  item, 
  onClose, 
  onUpdate,
  onDelete
}: { 
  item: ShoppingItem; 
  onClose: () => void; 
  onUpdate: (updated: ShoppingItem) => void;
  onDelete: () => void;
}) {
  const [localItem, setLocalItem] = useState<ShoppingItem>(item);

  const handleUpdate = (updates: Partial<ShoppingItem>) => {
    const updated = { ...localItem, ...updates };
    setLocalItem(updated);
    onUpdate(updated);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-morandi-sand/20"
      >
        <div className="p-8 pb-4 space-y-4 relative bg-white z-20">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-morandi-sand hover:text-morandi-clay transition-colors"
          >
            <X size={24} />
          </button>
          <h3 className="text-xl font-black text-morandi-clay">編輯項目</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 no-scrollbar">
          <div className="space-y-4">
            <div className="w-full aspect-square bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 relative overflow-hidden group">
              {localItem.image ? (
                <img src={localItem.image} alt={localItem.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera size={32} />
                  <span className="text-xs font-bold">點擊上傳照片</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleUpdate({ image: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-morandi-ash uppercase tracking-widest px-1">名稱</label>
              <textarea 
                className="w-full bg-morandi-mist border border-morandi-sand/20 rounded-2xl p-4 focus:outline-none text-sm text-morandi-clay font-bold min-h-[80px] resize-none"
                placeholder="輸入商品名稱..."
                value={localItem.name}
                onChange={e => handleUpdate({ name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-morandi-ash uppercase tracking-widest px-1">備註</label>
              <textarea 
                className="w-full bg-morandi-mist border border-morandi-sand/20 rounded-2xl p-4 focus:outline-none text-sm text-morandi-clay font-medium min-h-[100px] resize-none"
                placeholder="輸入備註..."
                value={localItem.remarks}
                onChange={e => handleUpdate({ remarks: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-morandi-ash uppercase tracking-widest px-1">連結</label>
              <div className="relative">
                <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-morandi-sand" />
                <input 
                  className="w-full bg-morandi-mist border border-morandi-sand/20 rounded-2xl p-4 pl-12 focus:outline-none text-sm text-morandi-clay font-medium"
                  placeholder="貼上連結..."
                  value={localItem.link || ''}
                  onChange={e => handleUpdate({ link: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-morandi-clay text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            儲存
          </button>
          <button
            onClick={onDelete}
            className="w-14 h-14 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors"
          >
            <Trash2 size={24} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function FlightEditModal({ 
  selectedFlight, 
  onClose, 
  onUpdate,
  setData
}: { 
  selectedFlight: FlightInfo; 
  onClose: () => void; 
  onUpdate: (updated: FlightInfo) => void;
  setData: React.Dispatch<React.SetStateAction<ItineraryData>>;
}) {
  const [localFlight, setLocalFlight] = useState<FlightInfo>(selectedFlight);

  const handleUpdate = (updates: Partial<FlightInfo>) => {
    const updated = { ...localFlight, ...updates };
    setLocalFlight(updated);
    onUpdate(updated);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-5">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex flex-col gap-4 sticky top-0 bg-white z-20">
          <div className="flex bg-slate-50 p-1 rounded-2xl">
            {['去程航班', '回程航班', '中轉航班'].map((label, idx) => {
              const type = (idx === 0 ? 'departure' : idx === 1 ? 'return' : 'transit') as 'departure' | 'return' | 'transit';
              return (
                <button
                  key={type}
                  onClick={() => handleUpdate({ type })}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-bold rounded-xl transition-all",
                    localFlight.type === type
                      ? "bg-white text-morandi-blue shadow-sm" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">航空公司</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-700 focus:outline-none"
                value={localFlight.airline}
                onChange={e => handleUpdate({ airline: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">航班號</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-700 focus:outline-none"
                value={localFlight.flightNumber}
                onChange={e => handleUpdate({ flightNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">起飛機場</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-700 focus:outline-none"
                value={localFlight.departureAirport}
                onChange={e => handleUpdate({ departureAirport: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">抵達機場</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-700 focus:outline-none"
                value={localFlight.arrivalAirport}
                onChange={e => handleUpdate({ arrivalAirport: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">起飛時間</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-700 focus:outline-none"
                value={localFlight.departureTime}
                onChange={e => handleUpdate({ departureTime: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">抵達時間</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-700 focus:outline-none"
                value={localFlight.arrivalTime}
                onChange={e => handleUpdate({ arrivalTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">航程時間</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-700 focus:outline-none"
                placeholder="例如: 3h 45m"
                value={localFlight.duration || ''}
                onChange={e => handleUpdate({ duration: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">行李重量</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-slate-700 focus:outline-none"
                placeholder="例如: 23kg"
                value={localFlight.baggageWeight || ''}
                onChange={e => handleUpdate({ baggageWeight: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">機票連結</label>
            <div className="relative">
              <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-3 pl-10 text-xs font-bold text-slate-700 focus:outline-none"
                placeholder="貼上連結..."
                value={localFlight.ticketUrl || ''}
                onChange={e => handleUpdate({ ticketUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button 
              onClick={onClose}
              className="flex-1 bg-morandi-blue text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              儲存
            </button>
            <button 
              onClick={() => {
                setData(prev => ({ ...prev, flights: prev.flights.filter(f => f.id !== localFlight.id) }));
                onClose();
              }}
              className="p-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function HotelEditModal({ 
  selectedHotel, 
  onClose, 
  onUpdate,
  setData
}: { 
  selectedHotel: HotelInfo; 
  onClose: () => void; 
  onUpdate: (updated: HotelInfo) => void;
  setData: React.Dispatch<React.SetStateAction<ItineraryData>>;
}) {
  const [localHotel, setLocalHotel] = useState<HotelInfo>(selectedHotel);

  const handleUpdate = (updates: Partial<HotelInfo>) => {
    const updated = { ...localHotel, ...updates };
    setLocalHotel(updated);
    onUpdate(updated);
    
    // Sync to itinerary spots if name changed
    if (updates.name) {
      setData(prev => ({
        ...prev,
        days: prev.days.map(d => ({
          ...d,
          spots: d.spots.map(s => s.category === 'hotel' && s.location === localHotel.name ? { ...s, location: updates.name! } : s)
        }))
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-5">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Bed size={24} className="text-morandi-clay" />
            編輯住宿
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">飯店名稱</label>
            <input 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none"
              value={localHotel.name}
              onChange={e => handleUpdate({ name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">飯店地址</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-4 text-slate-300" />
              <textarea 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold text-slate-700 focus:outline-none min-h-[80px]"
                value={localHotel.address}
                onChange={e => handleUpdate({ address: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">入住日期</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none"
                value={localHotel.checkIn}
                onChange={e => handleUpdate({ checkIn: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">退房日期</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none"
                value={localHotel.checkOut}
                onChange={e => handleUpdate({ checkOut: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">電話</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none"
                placeholder="例如: +81 75-xxx-xxxx"
                value={localHotel.phone || ''}
                onChange={e => handleUpdate({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">訂房連結</label>
              <div className="relative">
                <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold text-slate-700 focus:outline-none"
                  placeholder="貼上連結..."
                  value={localHotel.bookingUrl || ''}
                  onChange={e => handleUpdate({ bookingUrl: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">備註</label>
              <textarea 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none min-h-[80px]"
                placeholder="輸入備註資訊..."
                value={localHotel.remarks || ''}
                onChange={e => handleUpdate({ remarks: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button 
              onClick={onClose}
              className="flex-1 bg-morandi-clay text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              儲存
            </button>
            <button 
              onClick={() => {
                setData(prev => ({ ...prev, hotels: prev.hotels.filter(h => h.id !== localHotel.id) }));
                onClose();
              }}
              className="p-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function TransportEditModal({ 
  selectedOrder, 
  onClose, 
  onUpdate,
  setData
}: { 
  selectedOrder: TransportOrder; 
  onClose: () => void; 
  onUpdate: (updated: TransportOrder) => void;
  setData: React.Dispatch<React.SetStateAction<ItineraryData>>;
}) {
  const [localOrder, setLocalOrder] = useState<TransportOrder>(selectedOrder);

  const handleUpdate = (updates: Partial<TransportOrder>) => {
    const updated = { ...localOrder, ...updates };
    setLocalOrder(updated);
    onUpdate(updated);

    // Sync to itinerary spots if name changed
    if (updates.name) {
      setData(prev => ({
        ...prev,
        days: prev.days.map(d => ({
          ...d,
          spots: d.spots.map(s => s.category === 'transport' && s.location === localOrder.name ? { ...s, location: updates.name! } : s)
        }))
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-5">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Bus size={24} className="text-morandi-clay" />
            編輯交通&其它資訊
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">名稱</label>
            <input 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none"
              value={localOrder.name}
              onChange={e => handleUpdate({ name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">日期</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none"
                placeholder="例如: 06/02"
                value={localOrder.date || ''}
                onChange={e => handleUpdate({ date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">時間</label>
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none"
                placeholder="例如: 13:00"
                value={localOrder.time || ''}
                onChange={e => handleUpdate({ time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">地點</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold text-slate-700 focus:outline-none"
                placeholder="例如: 博多站"
                value={localOrder.location || ''}
                onChange={e => handleUpdate({ location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">票卷連結</label>
            <div className="relative">
              <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              <input 
                className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold text-slate-700 focus:outline-none"
                placeholder="貼上連結..."
                value={localOrder.url || ''}
                onChange={e => handleUpdate({ url: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">備註</label>
            <textarea 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none min-h-[80px] resize-none"
              placeholder="交通備註..."
              value={localOrder.remarks || ''}
              onChange={e => handleUpdate({ remarks: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button 
              onClick={onClose}
              className="flex-1 bg-morandi-clay text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 transition-opacity"
            >
              儲存
            </button>
            <button 
              onClick={() => {
                setData(prev => ({ ...prev, transportOrders: prev.transportOrders.filter(o => o.id !== localOrder.id) }));
                onClose();
              }}
              className="p-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] py-1 border-b border-slate-100 w-full mb-2">
    <Icon size={14} className="text-morandi-blue" />
    <span>{title}</span>
  </div>
);

const AboutGrid = ({ fields, localSpot, handleUpdate }: { 
  fields: ('phone' | 'hours' | 'duration' | 'reservation' | 'ticket')[],
  localSpot: Spot,
  handleUpdate: (updates: Partial<Spot>) => void
}) => (
  <div className="space-y-4">
    <SectionTitle icon={Info} title="關於此處 (ABOUT)" />
    <div className="space-y-3">
      {fields.includes('phone') && (
        <div className="bg-white p-4 rounded-2xl border border-morandi-sand/20 space-y-2 shadow-sm">
          <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">PHONE</p>
          <input 
            className="w-full bg-transparent border-none font-bold text-morandi-clay focus:outline-none text-sm"
            placeholder="電話號碼"
            value={localSpot.phone || ''}
            onChange={e => handleUpdate({ phone: e.target.value })}
          />
        </div>
      )}
      {fields.includes('hours') && (
        <div className="bg-white p-4 rounded-2xl border border-morandi-sand/20 space-y-2 shadow-sm">
          <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">HOURS</p>
          <input 
            className="w-full bg-transparent border-none font-bold text-morandi-clay focus:outline-none text-sm"
            placeholder="營業時間"
            value={localSpot.openingHours || ''}
            onChange={e => handleUpdate({ openingHours: e.target.value })}
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {fields.includes('duration') && (
          <div className="bg-white p-4 rounded-2xl border border-morandi-sand/20 space-y-2 shadow-sm">
            <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">DURATION</p>
            <input 
              className="w-full bg-transparent border-none font-bold text-morandi-clay focus:outline-none text-sm"
              placeholder="停留時間"
              value={localSpot.stayDuration || ''}
              onChange={e => handleUpdate({ stayDuration: e.target.value })}
            />
          </div>
        )}
        {fields.includes('reservation') && (
          <div className="bg-white p-4 rounded-2xl border border-morandi-sand/20 space-y-2 shadow-sm">
            <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">RESERVATION</p>
            <div className="flex items-center gap-4 pt-1">
              <button 
                onClick={() => handleUpdate({ reservationRequired: true })}
                className={cn("flex-1 py-1 rounded-lg text-[10px] font-bold transition-all", localSpot.reservationRequired ? "bg-morandi-clay text-white" : "bg-morandi-mist text-morandi-ash")}
              >
                YES
              </button>
              <button 
                onClick={() => handleUpdate({ reservationRequired: false })}
                className={cn("flex-1 py-1 rounded-lg text-[10px] font-bold transition-all", !localSpot.reservationRequired ? "bg-morandi-clay text-white" : "bg-morandi-mist text-morandi-ash")}
              >
                NO
              </button>
            </div>
          </div>
        )}
      </div>
      {fields.includes('ticket') && (
        <div className="bg-white p-4 rounded-2xl border border-morandi-sand/20 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">TICKET PRICE</p>
            <div className="flex bg-morandi-mist p-1 rounded-xl">
                <button 
                  onClick={() => handleUpdate({ ticketCurrency: 'JPY' })}
                  className={cn("px-3 py-1 rounded-lg text-[10px] font-bold transition-all", localSpot.ticketCurrency === 'JPY' ? "bg-white text-morandi-clay shadow-sm" : "text-morandi-ash")}
                >
                  JPY ¥
                </button>
                <button 
                  onClick={() => handleUpdate({ ticketCurrency: 'TWD' })}
                  className={cn("px-3 py-1 rounded-lg text-[10px] font-bold transition-all", localSpot.ticketCurrency === 'TWD' ? "bg-white text-morandi-clay shadow-sm" : "text-morandi-ash")}
                >
                  TWD $
                </button>
            </div>
          </div>
          <input 
            className="w-full bg-transparent border-none font-black text-morandi-clay focus:outline-none text-xl"
            placeholder="0"
            type="number"
            value={localSpot.ticketPrice || ''}
            onChange={e => handleUpdate({ ticketPrice: Number(e.target.value) })}
          />
        </div>
      )}
    </div>
  </div>
);

function SpotEditModal({ 
  selectedSpot, 
  onClose, 
  onUpdate, 
  onDelete, 
  onGenerateInsight, 
  isGenerating,
  setActiveTab,
  data,
  setData
}: { 
  selectedSpot: { dayId: string; spot: Spot }; 
  onClose: () => void;
  onUpdate: (updates: Partial<Spot>) => void;
  onDelete: () => void;
  onGenerateInsight: () => void;
  isGenerating: boolean;
  setActiveTab: (tab: 'daily' | 'billing' | 'guide' | 'shopping') => void;
  data: ItineraryData;
  setData: React.Dispatch<React.SetStateAction<ItineraryData>>;
}) {
  const [localSpot, setLocalSpot] = useState<Spot>(selectedSpot.spot);

  // Sync local state to parent on change (debounced or on blur would be better, but let's try immediate for now with local state which is smoother)
  // Actually, to make it perfectly smooth, we update local state immediately and parent state on blur or unmount.
  const handleUpdate = (updates: Partial<Spot>) => {
    const newSpot = { ...localSpot, ...updates };
    setLocalSpot(newSpot);
    onUpdate(updates);
  };

  // Inlining NearbyFoodSection to avoid focus loss issue
  const nearbyFoodContent = (
    <div className="space-y-4">
      <SectionTitle icon={Utensils} title="附近美食 (NEARBY FOOD)" />
      <div className="grid grid-cols-2 gap-4">
        {localSpot.nearbyFood?.map((food, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group relative">
            <button 
              onClick={() => {
                const newList = [...(localSpot.nearbyFood || [])];
                newList.splice(idx, 1);
                handleUpdate({ nearbyFood: newList });
              }}
              className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-red-400 transition-opacity shadow-sm"
            >
              <Trash2 size={12} />
            </button>
            <div className="aspect-square bg-slate-100 relative overflow-hidden">
              {food.image ? (
                <img src={food.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Camera size={24} />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const newList = [...(localSpot.nearbyFood || [])];
                      newList[idx] = { ...newList[idx], image: reader.result as string };
                      handleUpdate({ nearbyFood: newList });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <div className="p-3 space-y-1">
              <input 
                className="w-full bg-transparent border-none font-bold text-slate-800 text-[10px] focus:outline-none text-center"
                value={food.name}
                onChange={e => {
                  const newList = [...(localSpot.nearbyFood || [])];
                  newList[idx] = { ...newList[idx], name: e.target.value };
                  handleUpdate({ nearbyFood: newList });
                }}
              />
              <div className="flex justify-center">
                <a href={food.mapUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                  <Navigation size={12} />
                </a>
              </div>
            </div>
          </div>
        ))}
        <button 
          onClick={() => {
            const newFood = { id: Math.random().toString(36).substr(2, 9), name: '餐廳名稱', mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('餐廳名稱')}` };
            handleUpdate({ nearbyFood: [...(localSpot.nearbyFood || []), newFood] });
          }}
          className="aspect-square bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors gap-2"
        >
          <Plus size={24} />
          <span className="text-[10px] font-bold">新增美食項目</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-morandi-sand/20"
      >
        {/* Modal Header */}
        <div className="p-8 pb-4 space-y-4 relative bg-white z-20">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-morandi-sand hover:text-morandi-clay transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4">
            <select 
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest focus:outline-none",
                CATEGORY_COLORS[localSpot.category].split(' ')[0], // bg
                CATEGORY_COLORS[localSpot.category].split(' ')[1]  // text
              )}
              value={localSpot.category}
              onChange={e => handleUpdate({ category: e.target.value as Category })}
            >
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 text-morandi-clay font-bold">
              <Clock size={14} className="text-morandi-sage" />
              <input 
                className="text-sm bg-transparent border-none focus:outline-none w-16"
                value={localSpot.time}
                onChange={e => handleUpdate({ time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <input 
              className="text-xl font-black text-morandi-clay bg-transparent border-none focus:outline-none w-full tracking-tight"
              placeholder="中文名稱"
              value={localSpot.location}
              onChange={e => handleUpdate({ location: e.target.value })}
            />
            <div className="space-y-1">
              <input 
                className="text-base font-bold text-morandi-ash bg-transparent border-none focus:outline-none w-full tracking-tight"
                placeholder="日文名稱"
                value={localSpot.locationJp || ''}
                onChange={e => handleUpdate({ locationJp: e.target.value })}
              />
              <div className="flex items-center gap-2 text-morandi-ash/60">
                <a 
                  href={localSpot.googleMapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localSpot.address || localSpot.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-500 transition-colors"
                >
                  <MapPin size={14} />
                </a>
                <input 
                  className="w-full bg-transparent border-none font-medium text-morandi-ash focus:outline-none text-xs"
                  placeholder="輸入地址..."
                  value={localSpot.address || ''}
                  onChange={e => {
                    const addr = e.target.value;
                    handleUpdate({ 
                      address: addr,
                      googleMapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`
                    });
                  }}
                />
              </div>
              <div className="mt-2">
                <textarea 
                  className="w-full bg-slate-50 border-none rounded-2xl p-3 text-xs font-bold text-morandi-clay focus:outline-none resize-none"
                  placeholder="行程描述 (小字)..."
                  rows={2}
                  value={localSpot.description || ''}
                  onChange={e => handleUpdate({ description: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 no-scrollbar">
          {localSpot.category === 'food' && (
            <>
              <AboutGrid fields={['phone', 'hours', 'duration', 'reservation']} localSpot={localSpot} handleUpdate={handleUpdate} />
              <div className="space-y-4">
                <SectionTitle icon={Utensils} title="推薦菜單 (RECOMMENDED MENU)" />
                <div className="grid grid-cols-2 gap-4">
                  {(localSpot.recommendedMenuItems || []).map((item, idx) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-morandi-sand/20 overflow-hidden shadow-sm group relative">
                      <button 
                        onClick={() => {
                          const newList = [...(localSpot.recommendedMenuItems || [])];
                          newList.splice(idx, 1);
                          handleUpdate({ recommendedMenuItems: newList });
                        }}
                        className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-red-400 transition-opacity shadow-sm"
                      >
                        <Trash2 size={12} />
                      </button>
                      
                      <div className="aspect-square bg-morandi-mist relative overflow-hidden">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-morandi-sand">
                            <Camera size={24} />
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const newList = [...(localSpot.recommendedMenuItems || [])];
                                newList[idx] = { ...newList[idx], image: reader.result as string };
                                handleUpdate({ recommendedMenuItems: newList });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                      
                      <div className="p-3 bg-white">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              const newList = [...(localSpot.recommendedMenuItems || [])];
                              newList[idx] = { ...newList[idx], completed: !newList[idx].completed };
                              handleUpdate({ recommendedMenuItems: newList });
                            }}
                            className={cn("transition-colors", item.completed ? "text-morandi-sage" : "text-morandi-sand")}
                          >
                            {item.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                          </button>
                          <input 
                            className={cn("flex-1 text-[10px] font-bold bg-transparent border-none focus:outline-none text-morandi-clay", item.completed && "line-through text-morandi-ash")}
                            value={item.name}
                            placeholder="菜單名稱"
                            onChange={e => {
                              const newList = [...(localSpot.recommendedMenuItems || [])];
                              newList[idx] = { ...newList[idx], name: e.target.value };
                              handleUpdate({ recommendedMenuItems: newList });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newItem = { id: Math.random().toString(36).substr(2, 9), name: '', completed: false };
                      handleUpdate({ recommendedMenuItems: [...(localSpot.recommendedMenuItems || []), newItem] });
                    }}
                    className="aspect-square bg-morandi-mist border border-dashed border-morandi-sand/30 rounded-2xl flex flex-col items-center justify-center text-morandi-sand hover:bg-morandi-sand/10 transition-colors gap-2"
                  >
                    <Plus size={24} />
                    <span className="text-[10px] font-bold">新增菜單項目</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {localSpot.category === 'sightseeing' && (
            <>
              <AboutGrid fields={['phone', 'hours', 'duration', 'reservation', 'ticket']} localSpot={localSpot} handleUpdate={handleUpdate} />
              <div className="space-y-4">
                <SectionTitle icon={BookOpen} title="景點故事 (STORY)" />
                <textarea 
                  className="w-full bg-white p-4 rounded-2xl border border-morandi-sand/20 focus:outline-none text-sm text-morandi-clay leading-relaxed min-h-[100px] resize-none shadow-sm"
                  placeholder="輸入景點故事..."
                  value={localSpot.story || ''}
                  onChange={e => handleUpdate({ story: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <SectionTitle icon={Camera} title="旅遊攻略 (GUIDE)" />
                <div className="space-y-4">
                  <textarea 
                    className="w-full bg-white p-4 rounded-2xl border border-morandi-sand/20 focus:outline-none text-sm text-morandi-clay leading-relaxed min-h-[150px] resize-none shadow-sm"
                    placeholder="在此輸入旅遊攻略、注意事項或心得..."
                    value={localSpot.guideText || ''}
                    onChange={e => handleUpdate({ guideText: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    {(localSpot.images || []).map((img, idx) => (
                      <div key={idx} className="aspect-video bg-morandi-mist rounded-2xl border border-morandi-sand/20 overflow-hidden relative group">
                        <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => {
                            const newList = [...(localSpot.images || [])];
                            newList.splice(idx, 1);
                            handleUpdate({ images: newList });
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-red-400 transition-opacity shadow-sm"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <div className="aspect-video bg-morandi-mist rounded-2xl border border-dashed border-morandi-sand/30 flex items-center justify-center text-morandi-sand overflow-hidden relative">
                      <div className="text-center">
                        <Plus size={24} className="mx-auto mb-1" />
                        <span className="text-[10px] font-bold">新增照片</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handleUpdate({ images: [...(localSpot.images || []), reader.result as string] });
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {nearbyFoodContent}
            </>
          )}

          {localSpot.category === 'transport' && (
            <div className="space-y-6">
              <SectionTitle icon={Bus} title="交通&其它資訊" />
              <div className="grid grid-cols-1 gap-4">
                {data.transportOrders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[32px] border border-morandi-sand/20 shadow-sm group relative">
                    <div className="flex gap-4">
                      <div className="bg-morandi-blue/10 w-12 h-12 rounded-2xl flex-none flex items-center justify-center text-morandi-blue transition-colors">
                        <Ticket size={24} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">TRANSPORT NAME</p>
                          <input 
                            className="w-full bg-transparent border-none font-black text-lg text-morandi-clay focus:outline-none"
                            placeholder="交通名稱"
                            value={order.name}
                            onChange={e => {
                              const newName = e.target.value;
                              setData(prev => ({
                                ...prev,
                                transportOrders: prev.transportOrders.map(o => o.id === order.id ? { ...o, name: newName } : o),
                                days: prev.days.map(d => ({
                                  ...d,
                                  spots: d.spots.map(s => s.id === localSpot.id ? { ...s, location: newName } : s)
                                }))
                              }));
                              setLocalSpot(prev => ({ ...prev, location: newName }));
                            }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">DEPARTURE TIME</p>
                            <div className="flex items-center gap-2 text-morandi-ash/60">
                              <Clock size={14} />
                              <input 
                                className="w-full bg-transparent border-none font-bold text-morandi-clay focus:outline-none text-xs"
                                value={order.time || ''}
                                onChange={e => setData(prev => ({
                                  ...prev,
                                  transportOrders: prev.transportOrders.map(o => o.id === order.id ? { ...o, time: e.target.value } : o)
                                }))}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">LOCATION</p>
                            <div className="flex items-center gap-2 text-morandi-ash/60">
                              <MapPin size={14} />
                              <input 
                                className="w-full bg-transparent border-none font-bold text-morandi-clay focus:outline-none text-xs"
                                value={order.location || ''}
                                onChange={e => setData(prev => ({
                                  ...prev,
                                  transportOrders: prev.transportOrders.map(o => o.id === order.id ? { ...o, location: e.target.value } : o)
                                }))}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="space-y-1">
                            <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">TICKET LINK / URL</p>
                            <div className="flex items-center gap-2 bg-morandi-mist rounded-xl px-3 py-2">
                              <Link size={14} className="text-morandi-ash" />
                              <input 
                                className="w-full bg-transparent border-none text-xs font-bold text-morandi-clay focus:outline-none"
                                placeholder="票卷連結..."
                                value={order.url || ''}
                                onChange={e => setData(prev => ({
                                  ...prev,
                                  transportOrders: prev.transportOrders.map(o => o.id === order.id ? { ...o, url: e.target.value } : o)
                                }))}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">REMARKS</p>
                            <textarea 
                              className="w-full bg-morandi-mist border-none rounded-xl p-3 text-xs font-bold text-morandi-clay focus:outline-none min-h-[60px] resize-none"
                              placeholder="交通備註..."
                              value={order.remarks || ''}
                              onChange={e => setData(prev => ({
                                ...prev,
                                transportOrders: prev.transportOrders.map(o => o.id === order.id ? { ...o, remarks: e.target.value } : o)
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {localSpot.category === 'hotel' && (
            <div className="space-y-6">
              <SectionTitle icon={Bed} title="住宿資訊" />
              <div className="grid grid-cols-1 gap-4">
                {data.hotels.map(hotel => (
                  <div key={hotel.id} className="bg-white p-6 rounded-[32px] border border-morandi-sand/20 shadow-sm group relative">
                    <div className="flex gap-4">
                      <div className="bg-morandi-clay/10 w-12 h-12 rounded-2xl flex-none flex items-center justify-center text-morandi-clay transition-colors">
                        <Bed size={24} />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">HOTEL NAME</p>
                          <input 
                            className="w-full bg-transparent border-none font-black text-lg text-morandi-clay focus:outline-none"
                            placeholder="飯店名稱"
                            value={hotel.name}
                            onChange={e => {
                              const newName = e.target.value;
                              setData(prev => ({
                                ...prev,
                                hotels: prev.hotels.map(h => h.id === hotel.id ? { ...h, name: newName } : h),
                                days: prev.days.map(d => ({
                                  ...d,
                                  spots: d.spots.map(s => s.id === localSpot.id ? { ...s, location: newName } : s)
                                }))
                              }));
                              setLocalSpot(prev => ({ ...prev, location: newName }));
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">ADDRESS</p>
                          <div className="flex items-center gap-2 text-morandi-ash/60">
                            <MapPin size={14} />
                            <input 
                              className="w-full bg-transparent border-none font-medium text-morandi-ash focus:outline-none text-xs"
                              placeholder="飯店地址"
                              value={hotel.address || ''}
                              onChange={e => setData(prev => ({
                                ...prev,
                                hotels: prev.hotels.map(h => h.id === hotel.id ? { ...h, address: e.target.value } : h)
                              }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">CHECK IN</p>
                            <input 
                              className="w-full bg-morandi-mist border-none rounded-xl p-2 text-[10px] font-bold text-morandi-clay focus:outline-none"
                              value={hotel.checkIn}
                              onChange={e => setData(prev => ({
                                ...prev,
                                hotels: prev.hotels.map(h => h.id === hotel.id ? { ...h, checkIn: e.target.value } : h)
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] text-morandi-ash font-bold uppercase tracking-widest">CHECK OUT</p>
                            <input 
                              className="w-full bg-morandi-mist border-none rounded-xl p-2 text-[10px] font-bold text-morandi-clay focus:outline-none"
                              value={hotel.checkOut}
                              onChange={e => setData(prev => ({
                                ...prev,
                                hotels: prev.hotels.map(h => h.id === hotel.id ? { ...h, checkOut: e.target.value } : h)
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {localSpot.category === 'shopping' && (
            <>
              <AboutGrid fields={['phone', 'hours', 'duration']} localSpot={localSpot} handleUpdate={handleUpdate} />
              <div className="space-y-4">
                <SectionTitle icon={ShoppingBag} title="購物攻略 (SHOPPING GUIDE)" />
                <textarea 
                  className="w-full bg-white p-4 rounded-2xl border border-morandi-sand/20 focus:outline-none text-sm text-morandi-clay leading-relaxed min-h-[100px] resize-none shadow-sm"
                  placeholder="輸入購物清單或攻略..."
                  value={localSpot.shoppingGuide || ''}
                  onChange={e => handleUpdate({ shoppingGuide: e.target.value })}
                />
              </div>
              {nearbyFoodContent}
            </>
          )}

          {/* Remarks Section */}
          <div className="space-y-4">
            <SectionTitle icon={Info} title="備註 (REMARKS)" />
            <textarea 
              className="w-full bg-white p-4 rounded-2xl border border-morandi-sand/20 focus:outline-none text-sm text-morandi-clay leading-relaxed min-h-[80px] resize-none shadow-sm"
              placeholder="輸入其他備註..."
              value={localSpot.notes || ''}
              onChange={e => handleUpdate({ notes: e.target.value })}
            />
          </div>

          {/* AI Insight Section */}
          {localSpot.aiInsight && (
            <div className="bg-morandi-sage/5 border border-morandi-sage/20 rounded-3xl overflow-hidden">
              <button 
                onClick={() => {
                  const el = document.getElementById('ai-insight-content');
                  if (el) el.classList.toggle('hidden');
                }}
                className="w-full p-4 flex items-center justify-between text-morandi-clay font-black text-xs uppercase tracking-widest"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-morandi-sage" />
                  <span>AI 智能攻略</span>
                </div>
                <ChevronDown size={14} />
              </button>
              <div id="ai-insight-content" className="p-4 pt-0 text-sm text-morandi-clay leading-relaxed prose prose-slate prose-sm max-w-none">
                <ReactMarkdown>{localSpot.aiInsight}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex items-center gap-3">
          <button
            onClick={onGenerateInsight}
            disabled={isGenerating}
            className="w-12 h-12 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="AI 智能攻略"
          >
            <Sparkles size={20} className={isGenerating ? "animate-pulse" : ""} />
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-morandi-clay text-white py-3 rounded-2xl font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
          >
            確認完成
          </button>
          <button
            onClick={onDelete}
            className="w-12 h-12 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
