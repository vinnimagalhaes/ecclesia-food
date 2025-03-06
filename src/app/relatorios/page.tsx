'use client';

import { Button } from '@/components/ui/Button';

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <div className="flex gap-2">
          <Button variant="secondary">Exportar PDF</Button>
          <Button variant="secondary">Exportar Excel</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total de Vendas (Mês)</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">R$ 0,00</p>
          <p className="mt-1 text-sm text-gray-600">Nenhuma venda registrada</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Rifas Ativas</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          <p className="mt-1 text-sm text-gray-600">Nenhuma rifa ativa</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Números Vendidos</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          <p className="mt-1 text-sm text-gray-600">Nenhum número vendido</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Clientes Ativos</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          <p className="mt-1 text-sm text-gray-600">Nenhum cliente registrado</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relatório
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Os relatórios serão carregados dinamicamente aqui */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 