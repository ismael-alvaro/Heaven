import { Handle, Position } from 'reactflow';

// Este é o componente que define o visual do nosso "Colaborador"
export default function ColaboradorNode({ data }: { data: any }) {
  return (
    <div style={{
      background: '#fff',
      padding: '10px',
      borderRadius: '8px',
      border: '1px solid #1f77b4',
      width: '180px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Handles permitem conectar linhas ao topo e à base */}
      <Handle type="target" position={Position.Top} />
      
      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f77b4' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
        {data.cargo || 'Sem cargo definido'}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}