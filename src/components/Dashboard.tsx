
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActions } from '@/contexts/ActionContext';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';

const Dashboard: React.FC = () => {
  const { getActionSummary, actions } = useActions();
  const summary = getActionSummary();

  const chartData = [
    { name: 'Concluídas', value: summary.completed, color: '#10b981' },
    { name: 'Atrasadas', value: summary.delayed, color: '#ef4444' },
    { name: 'Pendentes', value: summary.pending, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <img 
          src="/lovable-uploads/bbef40c8-e0f3-4855-872c-98b10feabdd5.png" 
          alt="Total Data Logo" 
          className="h-8 mr-3 hidden sm:block" 
        />
        <h2 className="text-2xl font-bold tracking-tight">Dashboard de Ações</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas no prazo</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completed}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total > 0 
                ? `${Math.round((summary.completed / summary.total) * 100)}% do total`
                : '0% do total'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.delayed}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total > 0 
                ? `${Math.round((summary.delayed / summary.total) * 100)}% do total`
                : '0% do total'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total > 0 
                ? `${Math.round((summary.pending / summary.total) * 100)}% do total`
                : '0% do total'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Progresso geral</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={summary.completionRate} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground text-right">{summary.completionRate}%</p>
        </CardContent>
      </Card>
      
      {summary.total > 0 && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Distribuição de ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
