import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog.jsx'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { Label } from './ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx'

function DescontoModal({ isOpen, onClose, vendaId, onDescontoAplicado }) {
  const [valorDesconto, setValorDesconto] = useState('')
  const [tipoDesconto, setTipoDesconto] = useState('FIXO')
  const [motivo, setMotivo] = useState('')

  const handleAplicarDesconto = async () => {
    if (!vendaId || !valorDesconto || !motivo) {
      alert('Preencha todos os campos para aplicar o desconto.')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://127.0.0.1:5000/api/vendas/${vendaId}/desconto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          valor: parseFloat(valorDesconto),
          tipo: tipoDesconto,
          motivo: motivo,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onDescontoAplicado(data)
        onClose()
        setValorDesconto('')
        setTipoDesconto('FIXO')
        setMotivo('')
      } else {
        const error = await response.json()
        alert(error.message)
      }
    } catch (error) {
      console.error('Erro ao aplicar desconto:', error)
      alert('Erro ao aplicar desconto. Tente novamente.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aplicar Desconto</DialogTitle>
          <DialogDescription>
            Insira o valor ou percentual do desconto e o motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="valor" className="text-right">
              Valor/Percentual
            </Label>
            <Input
              id="valor"
              type="number"
              value={valorDesconto}
              onChange={(e) => setValorDesconto(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipo" className="text-right">
              Tipo
            </Label>
            <Select value={tipoDesconto} onValueChange={setTipoDesconto}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXO">Fixo (R$)</SelectItem>
                <SelectItem value="PERCENTUAL">Percentual (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAplicarDesconto}>Aplicar Desconto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DescontoModal
