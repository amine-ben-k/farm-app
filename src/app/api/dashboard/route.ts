import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Define interfaces for aggregated data
interface EarningsByMonth {
  animals: number;
  crops: number;
}

interface CostsByMonth {
  animals: number;
  crops: number;
  equipment: number;
  labor: number;
}

export async function GET() {
  try {
    // Fetch animal data
    const animalTypesRes = await pool.query('SELECT * FROM animal_types');
    const animalSalesRes = await pool.query('SELECT * FROM animal_sales');
    const costOfLivingHistoryRes = await pool.query('SELECT * FROM cost_of_living_history');

    const animalTypes = animalTypesRes.rows.map((type) => ({
      ...type,
      quantity: Number(type.quantity),
      initial_quantity: Number(type.initial_quantity),
      total_cost_of_living: Number(type.total_cost_of_living),
      total_sales: Number(type.total_sales),
    }));

    const animalSales = animalSalesRes.rows.map((sale) => ({
      ...sale,
      quantity: Number(sale.quantity),
      sale_price: Number(sale.sale_price),
      cost_per_unit: Number(sale.cost_per_unit),
      sale_date: sale.sale_date, // This is a Date object
    }));

    const costOfLivingHistory = costOfLivingHistoryRes.rows.map((entry) => ({
      ...entry,
      cost: Number(entry.cost),
    }));

    // Fetch crop data
    const cropsRes = await pool.query('SELECT * FROM crops');
    const cropSalesRes = await pool.query('SELECT * FROM crop_sales');
    const cropCostsRes = await pool.query('SELECT * FROM crop_costs');

    const crops = cropsRes.rows.map((crop) => ({
      ...crop,
      quantity: Number(crop.quantity),
      total_cost_of_care: Number(crop.total_cost_of_care),
    }));

    const cropSales = cropSalesRes.rows.map((sale) => ({
      ...sale,
      quantity: Number(sale.quantity),
      sale_price: Number(sale.sale_price),
      cost_per_unit_at_sale: Number(sale.cost_per_unit_at_sale),
      sale_date: sale.sale_date, // This is a Date object
    }));

    const cropCosts = cropCostsRes.rows.map((cost) => ({
      ...cost,
      amount: Number(cost.amount),
      cost_date: cost.cost_date, // This is a Date object
    }));

    // Fetch equipment data
    const equipmentsRes = await pool.query('SELECT * FROM equipments');
    const equipmentTransactionsRes = await pool.query('SELECT * FROM equipment_transactions');

    const equipments = equipmentsRes.rows.map((equipment) => ({
      ...equipment,
      maintenance_cost: Number(equipment.maintenance_cost),
    }));

    const equipmentTransactions = equipmentTransactionsRes.rows.map((transaction) => ({
      ...transaction,
      amount: Number(transaction.amount),
      transaction_date: transaction.transaction_date, // This is a Date object
    }));

    // Fetch labor costs (salary payments)
    const salaryPaymentsRes = await pool.query('SELECT * FROM salary_payments');
    const salaryPayments = salaryPaymentsRes.rows.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
      payment_date: payment.payment_date, // This is a Date object
    }));

    // Calculate totals
    const totalAnimalEarnings = animalSales.reduce((sum, sale) => sum + sale.sale_price, 0);
    const totalCropEarnings = cropSales.reduce((sum, sale) => sum + sale.sale_price, 0);
    const totalEarnings = totalAnimalEarnings + totalCropEarnings;

    const totalAnimalCosts = animalTypes.reduce((sum, type) => sum + type.total_cost_of_living, 0);
    const totalCropCosts = cropCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const totalEquipmentCosts = equipments.reduce((sum, eq) => sum + eq.maintenance_cost, 0) +
      equipmentTransactions.reduce((sum, trans) => sum + trans.amount, 0);
    const totalLaborCosts = salaryPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalCosts = totalAnimalCosts + totalCropCosts + totalEquipmentCosts + totalLaborCosts;

    const totalProfit = totalEarnings - totalCosts;

    const totalAnimals = animalTypes.reduce((sum, type) => sum + type.quantity, 0);
    const totalCrops = crops.reduce((sum, crop) => sum + crop.quantity, 0);

    // Cost distribution for pie chart
    const costDistribution = {
      Animals: totalAnimalCosts,
      Crops: totalCropCosts,
      Equipment: totalEquipmentCosts,
      Labor: totalLaborCosts,
    };

    // Earnings over time (aggregate by month)
    const earningsOverTime: { [month: string]: EarningsByMonth } = {};
    animalSales.forEach((sale) => {
      const month = sale.sale_date.toISOString().slice(0, 7); // Convert Date to YYYY-MM
      if (!earningsOverTime[month]) earningsOverTime[month] = { animals: 0, crops: 0 };
      earningsOverTime[month].animals += sale.sale_price;
    });
    cropSales.forEach((sale) => {
      const month = sale.sale_date.toISOString().slice(0, 7); // Convert Date to YYYY-MM
      if (!earningsOverTime[month]) earningsOverTime[month] = { animals: 0, crops: 0 };
      earningsOverTime[month].crops += sale.sale_price;
    });

    // Profit over time (aggregate by month)
    const profitOverTime: { [month: string]: number } = {};
    const costsByMonth: { [month: string]: CostsByMonth } = {};

    // Aggregate costs by month
    costOfLivingHistory.forEach((entry) => {
      const month = entry.month; // Already in YYYY-MM format
      if (!costsByMonth[month]) costsByMonth[month] = { animals: 0, crops: 0, equipment: 0, labor: 0 };
      costsByMonth[month].animals += entry.cost;
    });

    cropCosts.forEach((cost) => {
      const month = cost.cost_date.toISOString().slice(0, 7); // Convert Date to YYYY-MM
      if (!costsByMonth[month]) costsByMonth[month] = { animals: 0, crops: 0, equipment: 0, labor: 0 };
      costsByMonth[month].crops += cost.amount;
    });

    equipmentTransactions.forEach((trans) => {
      const month = trans.transaction_date.toISOString().slice(0, 7); // Convert Date to YYYY-MM
      if (!costsByMonth[month]) costsByMonth[month] = { animals: 0, crops: 0, equipment: 0, labor: 0 };
      costsByMonth[month].equipment += trans.amount;
    });

    salaryPayments.forEach((payment) => {
      const month = payment.payment_date.toISOString().slice(0, 7); // Convert Date to YYYY-MM
      if (!costsByMonth[month]) costsByMonth[month] = { animals: 0, crops: 0, equipment: 0, labor: 0 };
      costsByMonth[month].labor += payment.amount;
    });

    // Calculate profit per month
    Object.keys(earningsOverTime).forEach((month) => {
      const earnings = (earningsOverTime[month].animals || 0) + (earningsOverTime[month].crops || 0);
      const costs = (costsByMonth[month]?.animals || 0) +
                    (costsByMonth[month]?.crops || 0) +
                    (costsByMonth[month]?.equipment || 0) +
                    (costsByMonth[month]?.labor || 0);
      profitOverTime[month] = earnings - costs;
    });

    return NextResponse.json({
      summary: {
        totalEarnings,
        totalCosts,
        totalProfit,
        totalAnimals,
        totalCrops,
      },
      costDistribution,
      earningsOverTime,
      profitOverTime,
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}