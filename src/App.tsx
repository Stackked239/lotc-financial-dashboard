import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinancialProvider } from './context/FinancialContext';
import Layout from './components/Layout';
import Executive from './pages/Executive';
import Revenue from './pages/Revenue';
import Expenses from './pages/Expenses';
import Programs from './pages/Programs';
import BudgetAnalysis from './pages/BudgetAnalysis';
import Trends from './pages/Trends';
import DonationsSocial from './pages/DonationsSocial';

export default function App() {
  return (
    <BrowserRouter>
      <FinancialProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Executive />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/budget" element={<BudgetAnalysis />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/donations-social" element={<DonationsSocial />} />
          </Routes>
        </Layout>
      </FinancialProvider>
    </BrowserRouter>
  );
}
