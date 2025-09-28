import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog.jsx'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { Label } from './ui/label.jsx'

function CancelamentoModal({ isOpen, onClose, vendaId, vendaStatus, onVendaCancelada }) {
  const [motivo, setMotivo] = useState('')

  const handleCancelarVenda = async () => {
    if (!vendaId || !motivo) {
      alert('Preencha o motivo do cancelamento.')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://127.0.0.1:5000/api/vendas/${vendaId}/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          motivo: motivo,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onVendaCancelada(data)
        onClose()
        setMotivo('')
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Erro ao cancelar venda:', error)
      alert('Erro ao cancelar venda. Tente novamente.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Venda</DialogTitle>
          <DialogDescription>
            Confirme o cancelamento da venda {vendaId} e informe o motivo.
            {vendaStatus === 'PAID' && (
              <p className="text-red-500 font-semibold mt-2">
                Atenção: Esta venda já foi paga. O estoque será reposto e um estorno será registrado.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="motivo" className="text-right">
              Motivo
            </Label>
            <Input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Voltar</Button>
          <Button variant="destructive" onClick={handleCancelarVenda}>Confirmar Cancelamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CancelamentoModal
