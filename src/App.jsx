import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Login from './Login'
import ModalPagamento from './ModalPagamento'
import NotaFiscal from './NotaFiscal' // <--- Import da Nota Fiscal
import './App.css'

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [senhaLogada, setSenhaLogada] = useState(null)

  const [carrinho, setCarrinho] = useState([])
  const [total, setTotal] = useState(0)
  const [codigoBarras, setCodigoBarras] = useState('')
  const inventario = useRef([])
  const [aviso, setAviso] = useState('')

  // Estados de TELA (Modal e Nota)
  const [modalAberto, setModalAberto] = useState(false)
  const [idVendaFinalizada, setIdVendaFinalizada] = useState(null) // <--- Estado da Nota

  useEffect(() => {
    if (usuarioLogado && senhaLogada) {
      const token = 'Basic ' + btoa(`${usuarioLogado}:${senhaLogada}`)
      axios.defaults.headers.common['Authorization'] = token
      carregarProdutos()
    }
  }, [usuarioLogado, senhaLogada])

  const carregarProdutos = () => {
    axios.get('http://localhost:8080/api/produtos')
      .then(resposta => inventario.current = resposta.data)
      .catch(erro => console.error("Erro ao carregar inventário:", erro))
  }

  const aoApertarEnter = (evento) => {
    if (evento.key === 'Enter') {
      if (codigoBarras.startsWith('-')) {
        const numeroDoItem = parseInt(codigoBarras.replace('-', ''))
        removerItem(numeroDoItem)
      } else if (codigoBarras.includes('*')) {
        const partes = codigoBarras.split('*')
        const qtd = parseInt(partes[0])
        const cod = partes[1]
        if (!isNaN(qtd) && cod) adicionarProduto(cod, qtd)
      } else {
        adicionarProduto(codigoBarras, 1)
      }
    }
  }

  const removerItem = (numeroItem) => {
    const indice = numeroItem - 1
    if (indice >= 0 && indice < carrinho.length) {
      const itemRemovido = carrinho[indice]
      const novoCarrinho = carrinho.filter((_, i) => i !== indice)
      setCarrinho(novoCarrinho)
      setTotal(total - itemRemovido.valorUnitario)
      setAviso(`ITEM ${numeroItem} CANCELADO!`)
      setCodigoBarras('')
      setTimeout(() => setAviso(''), 2000)
    }
  }

  const adicionarProduto = (codigo, quantidade = 1) => {
    const produtoEncontrado = inventario.current.find(p => p.codigoDeBarras === codigo)
    if (produtoEncontrado) {
      const novosItens = Array(quantidade).fill(produtoEncontrado)
      setCarrinho([...carrinho, ...novosItens])
      setTotal(total + (produtoEncontrado.valorUnitario * quantidade))
      setCodigoBarras('')
      setAviso('')
      if (quantidade > 1) {
        setAviso(`${quantidade}x ${produtoEncontrado.descricao} ADICIONADOS!`)
        setTimeout(() => setAviso(''), 2000)
      }
    } else {
      setAviso('PRODUTO NÃO ENCONTRADO!')
      setCodigoBarras('')
    }
  }

  const cancelarVenda = () => {
    if (confirm("Cancelar toda a venda?")) {
      setCarrinho([])
      setTotal(0)
    }
  }

  const solicitarFinalizacao = () => {
    if (carrinho.length === 0) {
      setAviso('CAIXA VAZIO!')
      return
    }
    setModalAberto(true)
  }

  // --- LÓGICA DE FINALIZAÇÃO ---
  const processarVendaNoJava = async (dadosDoModal) => {
    setModalAberto(false)

    // 1. Converte a lista do modal para o formato do Java
    const listaParaOJava = dadosDoModal.pagamentos.map(p => ({
      metodo: p.metodo === 'CARTAO' ? 'CARTAO_DEBITO' : 'DINHEIRO',
      valor: p.valor
    }))

    const vendaDTO = {
      cpfCliente: "",
      pagamentos: listaParaOJava // Lista completa de pagamentos
    }

    // 2. Abre a venda
    try {
      const respostaVenda = await axios.post('http://localhost:8080/api/vendas')
      const idVenda = respostaVenda.data.id

      // 3. Adiciona os itens
      const itensAgrupados = Object.values(carrinho.reduce((acc, item) => {
        const codigo = item.codigoDeBarras
        if (!acc[codigo]) {
          acc[codigo] = { codigoDeBarras: codigo, quantidade: 0 }
        }
        acc[codigo].quantidade += 1
        return acc
      }, {}))

      for (const item of itensAgrupados) {
        await axios.post(`http://localhost:8080/api/vendas/${idVenda}/itens`, {
          codigoDeBarras: item.codigoDeBarras,
          quantidade: item.quantidade
        })
      }

      // 5. Finaliza a Venda
      await axios.post(`http://localhost:8080/api/vendas/${idVenda}/finalizar`, vendaDTO)

      setIdVendaFinalizada(idVenda)
      setCarrinho([])
      setTotal(0)

    } catch (erro) {
      console.error("Erro ao processar venda:", erro)
      alert("Erro ao processar venda. Verifique o console.")
    }
  }

  // Função para quando clicar em "Próximo Cliente" na Nota
  const iniciarNovaVenda = () => {
    setIdVendaFinalizada(null) // Esconde a nota e volta pro PDV
  }

  // --- RENDERIZAÇÃO ---

  // 1. Se não logou, mostra Login
  if (!usuarioLogado) {
    return <Login onLoginSucesso={(user, pass) => {
      setUsuarioLogado(user)
      setSenhaLogada(pass)
    }} />
  }

  // 2. Se acabou de finalizar, mostra a Nota Fiscal
  if (idVendaFinalizada) {
    return <NotaFiscal idVenda={idVendaFinalizada} onNovaVenda={iniciarNovaVenda} />
  }

  // 3. Se não, mostra o PDV normal
  return (
    <div className="pdv-container">
      {modalAberto && (
        <ModalPagamento
          total={total}
          onConfirmar={processarVendaNoJava}
          onCancelar={() => setModalAberto(false)}
        />
      )}

      <div className="painel-esquerdo">
        <h2 className="cupom-titulo">🛒 CAIXA: {usuarioLogado.toUpperCase()}</h2>
        <div className="lista-produtos">
          {carrinho.map((produto, index) => (
            <div key={index} className="item-lista">
              <div>
                <strong>{index + 1}. {produto.descricao}</strong><br />
                <small>{produto.codigoDeBarras}</small>
              </div>
              <div>R$ {produto.valorUnitario.toFixed(2)}</div>
            </div>
          ))}
          <div id="fim-da-lista"></div>
        </div>
      </div>

      <div className="painel-direito">
        {aviso && <div className="aviso-box">{aviso}</div>}
        <div className="box-input">
          <label>CÓDIGO DE BARRAS</label>
          <input
            className="input-barras" autoFocus
            value={codigoBarras}
            onChange={e => setCodigoBarras(e.target.value)}
            onKeyDown={aoApertarEnter}
          />
        </div>
        <div className="box-total">
          <div className="titulo-total">Total</div>
          <h1 className="valor-total">R$ {total.toFixed(2)}</h1>
        </div>
        <div className="box-botoes">
          <button onClick={cancelarVenda} className="btn btn-cancelar">CANCELAR</button>
          <button onClick={solicitarFinalizacao} className="btn btn-finalizar">FINALIZAR</button>
        </div>
      </div>

    </div>
  )
}

export default App