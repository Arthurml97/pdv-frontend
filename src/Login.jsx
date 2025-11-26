import { useState } from 'react'
import axios from 'axios'

function Login({ onLoginSucesso }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [erro, setErro] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = (e) => {
        e.preventDefault()
        setErro('')
        setLoading(true)

        // 1. Cria o crachá (Token)
        const token = 'Basic ' + btoa(`${username}:${password}`)
        const axiosConfig = { headers: { 'Authorization': token } }

        // 2. TENTA ABRIR O CAIXA DIRETO (Sem testar antes)
        axios.post('http://localhost:8080/api/caixas/abrir', { saldoInicial: 0.0 }, axiosConfig)
            .then(() => {
                // Sucesso 201: Caixa abriu agora
                setLoading(false)
                onLoginSucesso(username, password)
            })
            .catch(err => {
                setLoading(false)

                // Se der erro 401: A SENHA ESTÁ ERRADA
                if (err.response && err.response.status === 401) {
                    setErro('Usuário ou senha incorretos!')
                }
                // Se der erro 400: A SENHA TÁ CERTA, MAS O CAIXA JÁ ESTAVA ABERTO
                else if (err.response && err.response.status === 400) {
                    console.log("Aviso do Java: " + err.response.data.message)
                    onLoginSucesso(username, password)
                }
                // Qualquer outro erro
                else {
                    setErro("Erro de conexão: " + err.message)
                }
            })
    }
    // Função para criar admin e adentrar no sistema
    const criarAdmin = () => {
        axios.post('http://localhost:8080/api/usuarios', {
            username: 'admin',
            password: '123',
            role: 'ROLE_SUPERVISOR'
        })
            .then(() => {
                alert('Usuário "admin" criado! Agora clique em ABRIR CAIXA.')
                setUsername('admin')
                setPassword('123')
            })
            .catch(err => alert('Erro: Talvez o usuário já exista.'))
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={{ color: '#ffcc00' }}>🔐 Abertura de Caixa</h1>

                <form onSubmit={handleLogin} style={styles.form}>
                    <input
                        type="text" placeholder="Usuário"
                        value={username} onChange={e => setUsername(e.target.value)}
                        style={styles.input}
                    />
                    <input
                        type="password" placeholder="Senha"
                        value={password} onChange={e => setPassword(e.target.value)}
                        style={styles.input}
                    />

                    {erro && <p style={{ color: 'red' }}>{erro}</p>}

                    <button type="submit" style={styles.btnEntrar} disabled={loading}>
                        {loading ? 'Verificando...' : 'ABRIR CAIXA'}
                    </button>
                </form>

                <hr style={{ borderColor: '#444', margin: '20px 0' }} />
                <button onClick={criarAdmin} style={styles.btnCriar}>
                    🛠️ Primeiro Acesso? Criar Admin
                </button>
            </div>
        </div>
    )
}

const styles = {
    container: { height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', color: 'white' },
    card: { backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '15px', width: '350px', textAlign: 'center', border: '1px solid #333' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#333', color: 'white', fontSize: '1rem' },
    btnEntrar: { padding: '15px', backgroundColor: '#00d4ff', color: '#121212', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' },
    btnCriar: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }
}

export default Login