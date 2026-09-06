/**
 * 行程编译器 - 核心逻辑
 * 输入：目的地数据 + 用户输入
 * 输出：完整的攻略 JSON（前端直接渲染）
 */

function compileItinerary(dest, input) {
  const days = input.days || dest.defaultDays || 5;
  const budgetPerPerson = input.budgetPerPerson || 3000;
  const group = input.group || { adults: 2, elderly: 0, children: 0 };
  const totalPeople = (group.adults || 0) + (group.elderly || 0) + (group.children || 0);
  const totalBudget = budgetPerPerson * totalPeople;
  const filters = input.filters || []; // ['no-spicy', 'no-seafood', 'fear-of-height', 'elderly-friendly', ...]
  const modules = input.modules || null; // null = 全部模块

  // 1. 过滤景点/餐厅
  const filteredSeoulAttractions = dest.attractions.seoul.filter(a => matchFilters(a, filters));
  const filteredBusanAttractions = dest.attractions.busan.filter(a => matchFilters(a, filters));
  const filteredRestaurants = dest.restaurants.filter(r => matchRestaurantFilters(r, filters));

  // 2. 决定城市分配（5天以上才去釜山）
  const goBusan = days >= 4;
  const cities = goBusan ? ['首尔', '釜山'] : ['首尔'];
  const daysInSeoul = goBusan ? Math.ceil(days * 0.6) : days;
  const daysInBusan = days - daysInSeoul;

  // 3. 生成每日行程
  const dailyPlan = generateDailyPlan(
    dest, filteredSeoulAttractions, filteredBusanAttractions, filteredRestaurants,
    days, daysInSeoul, daysInBusan, goBusan
  );

  // 4. 组装行程总览表
  const overview = generateOverview(dest, cities, days, daysInSeoul, daysInBusan, goBusan, dailyPlan);

  // 5. 生成预算明细
  const budgetDetail = generateBudget(dest, totalBudget, budgetPerPerson, totalPeople);

  // 6. 生成所有模块
  const result = {
    metadata: {
      destination: dest.name,
      country: dest.country,
      days,
      budgetPerPerson,
      totalBudget,
      totalPeople,
      group,
      filters,
      generatedAt: new Date().toISOString()
    },

    modules: {
      overview: modules ? (modules.overview !== false ? overview : null) : overview,
      dailyPlan: modules ? (modules.dailyPlan !== false ? dailyPlan : null) : dailyPlan,
      attractions: modules ? (modules.attractions !== false ? dest.attractions : null) : dest.attractions,
      transport: modules ? (modules.transport !== false ? dest.transport : null) : dest.transport,
      culturalTaboos: modules ? (modules.culturalTaboos !== false ? dest.culturalTaboos : null) : dest.culturalTaboos,
      accommodation: modules ? (modules.accommodation !== false ? dest.accommodation : null) : dest.accommodation,
      budget: modules ? (modules.budget !== false ? budgetDetail : null) : budgetDetail,
      timeline: modules ? (modules.timeline !== false ? dest.timeline : null) : dest.timeline,
      packing: modules ? (modules.packing !== false ? dest.packing : null) : dest.packing,
      souvenirs: modules ? (modules.souvenirs !== false ? dest.souvenirs : null) : dest.souvenirs
    }
  };

  // 标记点（用于地图渲染）
  result.poiList = collectPOIs(dailyPlan);

  return result;
}

/** 根据过滤器匹配景点 */
function matchFilters(attraction, filters) {
  if (!filters || filters.length === 0) return true;
  if (!attraction.filters) return true;

  for (const f of filters) {
    if (f === 'fear-of-height' && attraction.filters.avoidFearOfHeight) return false;
    if (f === 'no-seafood' && attraction.filters.avoidSeafood) return false;
    if (f === 'elderly-friendly' && !attraction.filters.easyForElderly) return false;
    if (f === 'no-long-walk' && attraction.filters.avoidLongWalk) return false;
  }
  return true;
}

function matchRestaurantFilters(restaurant, filters) {
  if (!filters || filters.length === 0) return true;
  if (filters.includes('no-spicy') && restaurant.tags) {
    // 简单排除
  }
  return true;
}

/** 生成每日行程 */
function generateDailyPlan(dest, seoulAttr, busanAttr, restaurants, totalDays, daysSeoul, daysBusan, goBusan) {
  const days = [];
  let dayNum = 1;

  // 首尔部分
  const seoulHotelArea = '明洞/市厅/光化门';
  const seoulItinerary = [
    {
      day: dayNum,
      city: '首尔',
      hotel: seoulHotelArea,
      theme: '抵达首尔，古韵与市井夜游',
      items: [
        { time: '上午', activity: '飞抵首尔（仁川/金浦）', type: '交通', tip: '航班约 2 小时，建议选 10:00 前抵达航班' },
        { time: '12:00', activity: '酒店寄存行李，午餐', type: '逛吃', tip: '机场快线 + 出租车；推荐明洞附近酒店', poi: restaurants.find(r => r.city === 'seoul' && r.tags?.includes('韩餐')) },
        { time: '14:00', activity: getAttrByName(seoulAttr, '景福宫'), type: '景点', tip: '穿韩服免门票；换岗仪式整点举行' },
        { time: '15:30', activity: getAttrByName(seoulAttr, '北村韩屋村'), type: '景点', tip: '从景福宫步行约 15 分钟；坡路较多' },
        { time: '17:00', activity: getAttrByName(seoulAttr, '三清洞咖啡街'), type: '美食', tip: '推荐传统茶屋小坐' },
        { time: '18:00', activity: getAttrByName(seoulAttr, '益善洞韩屋胡同'), type: '景点', tip: '比北村更精致，30 分钟可逛完' },
        { time: '19:30', activity: '晚餐：土俗村参鸡汤', type: '逛吃', tip: '人均 15,000-20,000 韩元', poi: restaurants.find(r => r.id === 'tosokchun') },
        { time: '20:30', activity: getAttrByName(seoulAttr, '清溪川'), type: '景点', tip: '夜景灯光美，适合散步' }
      ]
    }
  ];

  if (daysSeoul >= 2) {
    dayNum = 2;
    seoulItinerary.push({
      day: dayNum,
      city: '首尔',
      hotel: seoulHotelArea,
      theme: '韩药文化 + 宫殿与购物',
      items: [
        { time: '09:00', activity: getAttrByName(seoulAttr, '首尔药令市韩医药博物馆'), type: '景点', tip: '周二至周日开放，免费入场' },
        { time: '11:00', activity: '逛首尔药令市场', type: '市场', tip: '传统韩药材市场，可买养生茶' },
        { time: '12:00', activity: '午餐：药膳参鸡汤', type: '逛吃', tip: '清淡滋补，人均约 15,000 韩元' },
        { time: '14:00', activity: getAttrByName(seoulAttr, '昌德宫后苑'), type: '景点', tip: '必须提前官网预约！约 14:30 场次' },
        { time: '16:30', activity: '返回酒店稍作休息', type: '休息', tip: '保留体力' },
        { time: '17:30', activity: getAttrByName(seoulAttr, '南山首尔塔'), type: '景点', tip: '建议傍晚去看日落夜景；缆车排队久' },
        { time: '19:00', activity: '晚餐：王妃家烤肉', type: '逛吃', tip: '明洞店，人均约 30,000 韩元', poi: restaurants.find(r => r.id === 'wangbijia') },
        { time: '20:00', activity: getAttrByName(seoulAttr, '明洞购物街'), type: '购物', tip: '韩方药妆、免税店、OLIVE YOUNG' }
      ]
    });
  }

  // 如果还有更多首尔天数
  for (let d = 3; d <= daysSeoul; d++) {
    dayNum = d;
    // 简化：最后一天如果不釜山则安排返程
    if (!goBusan && d === daysSeoul) {
      seoulItinerary.push({
        day: dayNum,
        city: '首尔',
        hotel: '—',
        theme: '返程',
        items: [
          { time: '09:00', activity: '酒店早餐后退房', type: '交通' },
          { time: '上午', activity: '明洞最后逛街/取伴手礼', type: '购物' },
          { time: '下午', activity: '前往机场（建议提前 2.5 小时）', type: '交通' },
          { time: '傍晚', activity: '乘机返程', type: '交通' }
        ]
      });
    } else if (goBusan && d === daysSeoul) {
      // 最后一天首尔 → 釜山移动
      seoulItinerary.push({
        day: dayNum,
        city: '首尔 → 釜山',
        hotel: '海云台',
        theme: 'KTX 高铁移动 + 海滨放松',
        items: [
          { time: '08:30', activity: '酒店早餐后退房', type: '交通' },
          { time: '09:30', activity: '乘 KTX 高铁前往釜山', type: '交通', tip: '车程约 2 小时 40 分；提前官网购票' },
          { time: '12:10', activity: '抵达釜山，入住酒店', type: '交通', tip: '打车至海云台约 40 分钟' },
          { time: '13:30', activity: '午餐：密阳猪肉汤饭', type: '逛吃', tip: '人均约 10,000 韩元', poi: restaurants.find(r => r.id === 'milkyang') },
          { time: '15:00', activity: getAttrByName(busanAttr, '海云台海水浴场'), type: '景点', tip: '海边步道平缓，适合散步' },
          { time: '16:30', activity: getAttrByName(busanAttr, '海云台胶囊小火车'), type: '景点', tip: '必须提前预约！现场排队久' },
          { time: '18:00', activity: '青沙浦咖啡厅休息', type: '美食', tip: '海边咖啡厅可看海景' },
          { time: '19:00', activity: '晚餐：生鱼片或海鲜锅', type: '逛吃', tip: '人均 25,000-35,000 韩元' }
        ]
      });
    } else {
      // 中间补充一天
      seoulItinerary.push({
        day: dayNum,
        city: '首尔',
        hotel: seoulHotelArea,
        theme: '补充游览日',
        items: [
          { time: '09:00', activity: getAttrByName(seoulAttr, '首尔药令市韩医药博物馆'), type: '景点' },
          { time: '12:00', activity: '午餐', type: '逛吃' },
          { time: '14:00', activity: getAttrByName(seoulAttr, '昌德宫后苑'), type: '景点' },
          { time: '17:00', activity: getAttrByName(seoulAttr, '清溪川'), type: '景点' },
          { time: '19:00', activity: '晚餐', type: '逛吃' }
        ]
      });
    }
  }

  days.push(...seoulItinerary);

  // 釜山部分
  if (goBusan) {
    const busanStartDay = daysSeoul + 1;
    
    // Day N+1：釜山人文自然
    dayNum = busanStartDay;
    days.push({
      day: dayNum,
      city: '釜山',
      hotel: '海云台',
      theme: '釜山人文、自然与市场小吃',
      items: [
        { time: '09:00', activity: getAttrByName(busanAttr, '甘川文化村'), type: '景点', tip: '坡路多，入口可买地图盖章' },
        { time: '11:30', activity: getAttrByName(busanAttr, '札嘎其海鲜市场'), type: '市场', tip: '一楼买海鲜上楼加工；部分摊位只收现金' },
        { time: '14:00', activity: getAttrByName(busanAttr, '太宗台'), type: '景点', tip: '景区小火车可省力' },
        { time: '16:30', activity: getAttrByName(busanAttr, '富平罐头市场'), type: '市场', tip: '傍晚开始热闹，糖饼/鱼糕推荐' },
        { time: '18:30', activity: '晚餐：市场特色小吃', type: '逛吃', tip: '多种少量尝试' },
        { time: '20:00', activity: '返回酒店休息', type: '休息' }
      ]
    });

    // Day N+2：釜山放松返程
    dayNum = busanStartDay + 1;
    days.push({
      day: dayNum,
      city: '釜山 → 返程',
      hotel: '—',
      theme: '放松与返程',
      items: [
        { time: '09:00', activity: getAttrByName(busanAttr, 'SPA Land 汗蒸'), type: '景点', tip: '新世界百货内，入场费约 20,000 韩元' },
        { time: '12:00', activity: '午餐：新世界百货内餐厅', type: '逛吃' },
        { time: '14:00', activity: getAttrByName(busanAttr, '五六岛天空步道'), type: '景点', tip: '恐高者慎入！玻璃步道需穿鞋套' },
        { time: '16:00', activity: '前往金海国际机场', type: '交通', tip: '打车约 40 分钟，建议提前 2.5 小时' },
        { time: '18:00+', activity: '乘机返程', type: '交通' }
      ]
    });
  }

  return days;
}

function getAttrByName(list, name) {
  return list.find(a => a.name.includes(name)) || null;
}

/** 生成行程总览 */
function generateOverview(dest, cities, days, daysSeoul, daysBusan, goBusan, dailyPlan) {
  const citySummary = dailyPlan.map(d => ({
    day: d.day,
    city: d.city,
    hotel: d.hotel,
    theme: d.theme
  }));

  return {
    title: `${dest.name}${goBusan ? '—釜山' : ''} ${days}天${Math.max(0, days - 1)}晚 攻略`,
    cities,
    daysBreakdown: { seoul: daysSeoul, busan: daysBusan },
    dailySummary: citySummary
  };
}

/** 生成预算明细 */
function generateBudget(dest, totalBudget, budgetPerPerson, totalPeople) {
  const breakdown = dest.budget.budgetCategories.map(cat => {
    const ratio = (cat.low + cat.high) / 2 / 40000; // 归一化
    const amount = Math.round(totalBudget * ratio);
    return {
      name: cat.name,
      amount,
      note: cat.note
    };
  });

  const sum = breakdown.reduce((s, b) => s + b.amount, 0);

  return {
    total: totalBudget,
    perPerson: budgetPerPerson,
    people: totalPeople,
    breakdown,
    estimateNote: `以上为估算值，按 ${totalPeople} 人合计（人民币）。实际消费会因季节、酒店档次、购物而浮动。`
  };
}

/** 收集所有 POI（用于地图渲染） */
function collectPOIs(dailyPlan) {
  const pois = [];
  dailyPlan.forEach(day => {
    day.items.forEach(item => {
      if (item.activity && typeof item.activity === 'object' && item.activity.lat && item.activity.lng) {
        pois.push({
          day: day.day,
          name: item.activity.name,
          lat: item.activity.lat,
          lng: item.activity.lng,
          type: item.type || '景点',
          order: pois.length + 1
        });
      }
      if (item.poi && item.poi.lat && item.poi.lng) {
        pois.push({
          day: day.day,
          name: item.poi.name,
          lat: item.poi.lat,
          lng: item.poi.lng,
          type: item.type || '美食',
          order: pois.length + 1
        });
      }
    });
  });
  return pois;
}

module.exports = { compileItinerary };
