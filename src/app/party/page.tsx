'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSocket, disconnectSocket } from '@/lib/socket';
import styles from './party.module.css';
import UserName from "@/components/UserName";
import { Socket } from "socket.io-client";
import { createClient } from "@/lib/supabase/client";
import { PHASE_ANALYZE } from 'next/dist/shared/lib/constants';

type Question = { id: string; category: string; question: string; answer: string; options: string[]};
type Player = {
  id: string;
  name: string;
  score: number;
  question?: Question | null;
  swapUsed: boolean;
  lockUsed: boolean;
  wantsSwap: boolean;
  wantsLock: boolean;
  swappedThisRound: boolean;
  answered: boolean;
};

type LobbyState = {
  code: string;
  hostId: string;
  status: 'lobby' | 'in_game' | 'game_over';
  round: number;
  maxRounds: number;
  timerS: number;
  phase: string;
  phaseEndsAt: number | null;
  players: Player[];
};

export default function PartyPage() {
  
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [hasAnsweredLocally, setHasAnsweredLocally] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);


  useEffect(() => {
    async function connect() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const s = getSocket(session.access_token);
      setSocket(s);

      // once connected, request current lobby state using the stored code
      const requestState = () => {
        const code = localStorage.getItem('cc_lobby_code');
        if (code) s.emit('get_lobby_state', { code });
      };

      if (s.connected) {
        requestState();
      } else {
        s.once('connect', requestState);
      }
    }
    connect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: LobbyState) => {
      setLobby(data);
      // clear stored code when the game ends so stale state doesn't persist across tabs
      if (data.phase === 'game_over' || data.status === 'game_over') {
        localStorage.removeItem('cc_lobby_code');
      }
        if (data.phase === 'answer') {
        setHasAnsweredLocally(false);
      }
    };

    socket.on('lobby_update', handleUpdate);
    socket.on('game_update', handleUpdate);

    return () => {
      socket.off('lobby_update', handleUpdate);
      socket.off('game_update', handleUpdate);
    };
  }, [socket]);

  const submitAnswer = (correct: boolean) => {
    if (!lobby?.code || !socket || lobby.phase !== 'answer') return;
    setHasAnsweredLocally(true);
    socket.emit('submit_answer', { code: lobby.code, correct });
  };

 const checkcorrect = (answer?: string, attempt?: string): boolean => {
  
  return answer === attempt;
};

  const requestSwap = () => {
    if (!lobby?.code || !socket) return;
    socket.emit('request_swap', { code: lobby.code });
  };

  const requestLock = () => {
    if (!lobby?.code || !socket) return;
    socket.emit('request_lock', { code: lobby.code });
  };

  const handleLeaveGame = () => {
    localStorage.removeItem('cc_lobby_code');
    disconnectSocket();
    router.push('/student_home');
  };

  const me = socket && lobby?.players.find((p) => p.id === socket.id) || null;
  const timeLeftMs = lobby?.phaseEndsAt ? Math.max(lobby.phaseEndsAt - now, 0) : null;
  const timeLeft = timeLeftMs ? Math.ceil(timeLeftMs / 1000) : null;
  

  if (lobby?.phase === 'game_over') {
    const sorted = [...lobby.players].sort((a, b) => b.score - a.score);
    return (
      <div className={styles.page}>
        <header className={styles.nav}>
          <div className={styles.brand}>
            <span className={styles.brandMark} />
            <div>
              <p className={styles.brandTag}><UserName /></p>
              <p className={styles.brandTitle}>Card Clash</p>
              <p className={styles.brandTag}>Game over</p>
            </div>
          </div>
        </header>
        <main className={styles.main}>
          <section className={styles.panel}>
            <h2>Final Standings</h2>
            <div className={styles.playerGrid}>
              {sorted.map((p, i) => (
                <div key={p.id} className={styles.playerCard}>
                  <strong>#{i + 1} {p.name}</strong>
                  <span className={styles.badge}>{p.score} pts</span>
                </div>
              ))}
            </div>
            <button className={styles.primaryBtn} type="button" onClick={handleLeaveGame}>
              Back to home
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.brand}>
          <span className={styles.brandMark} />
          <div>
            <p className={styles.brandTag}><UserName /></p>
            <p className={styles.brandTitle}>Card Clash</p>
            <p className={styles.brandTag}>Party mode</p>
          </div>
        </div>
        <div className={styles.navActions}>
          <button className={styles.secondaryBtn} type="button" onClick={handleLeaveGame}>
            Leave game
          </button>
        </div>
      </header>

      <main className={styles.main}>
      
        <section className={styles.panel}>
          <h1 style={{ margin: '0' }}>Live Round</h1>
          {!lobby ? (
            <p className={styles.subtle}>Connecting to game...</p>
          ) : (
            <div className={styles.roundInfo}>
              <div style={{ margin: '0' }}>
                <p className={styles.subtle}>Lobby code</p>
                <p className={styles.code}>{lobby.code}</p>
              </div>
              <div style={{ margin: '0' }}>
                <p className={styles.subtle}>Round</p>
                <p className={styles.round}>{lobby.round || 1} / {lobby.maxRounds}</p>
              </div>
           {/* for debug
                <p className={styles.subtle}>Phase</p>
                <p className={styles.round}>{lobby.phase}</p>
              */}
  
            </div>
          )}
        </section>
        
        <section className={styles.panelflex}>
        <section className={styles.panelcard}>
          <section className={styles.flexset} >
          <h2>Your card</h2>
          
               
                <p> Time left: {timeLeft ?? '-'}</p>
          </section>
          {me?.question ? (
            <div className={styles.card}>
              <p className={styles.subtle}>{me.question.category}</p>
              <p className={styles.question}>{me.question.question}</p>
               {lobby?.phase === 'results' && (
                <>
                 <p className={styles.subtle} style={{ marginBottom: '0' }}></p>
                 <p className={styles.subtle} style={{ marginTop: '0' }}>Answer: {me.question.answer}</p>
                 </>
               )}
             
            
            </div>
          ) : (
            <p className={styles.subtle}>No question assigned yet.</p>
          )}
            
         
          <div className={styles.actions}>
            <button
              className={styles.secondaryBtn}
              type="button"
              onClick={requestSwap}
              disabled={!lobby || lobby.phase !== 'analyze' || me?.swapUsed || me?.wantsSwap}
            >
              Swap {me?.swapUsed ? '(used)' : ''}
            </button>
            <button
              className={styles.ghostBtn}
              type="button"
              onClick={requestLock}
              disabled={!lobby || lobby.phase !== 'analyze' || me?.lockUsed || me?.wantsLock}
            >
              Lock {me?.lockUsed ? '(used)' : ''}
            </button>
    
  
          </div>
            {lobby?.phase !== 'analyze' && (
              <>
                <h2>Choices</h2>
                <section className={styles.playerGrid}>
                  {me?.question?.options.map((option: string, index: number) => (
                    <button
                      key={index}
                      className={styles.secondaryBtn}
                      type="button"
                      onClick={() => {
                        setSelectedOption(option);
                        submitAnswer(checkcorrect(me?.question?.answer, option))}
                      }
                      disabled={!lobby || lobby.phase !== 'answer' || me?.answered || hasAnsweredLocally}
                    >
                      {option}
                      {selectedOption === option && lobby?.phase === 'results' ? ( checkcorrect(me?.question?.answer, option) ? " ✓" : " ✘") : null}
                      
                    </button>
                  ))}
                </section >
              </>
            )}
 
            
              
         
        </section>

        <section className={styles.panel}>
          <h2>Scoreboard</h2>
          {!lobby ? (
            <p className={styles.subtle}>No players yet.</p>
          ) : (
            <div className={styles.playerGrid}>
              {lobby.players.map((player) => (
                <div key={player.id} className={styles.playerCardScoreBoard}>
                  <strong>{player.name}</strong>
                  <span className={styles.badge}>Score: {player.score}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        </section>
      </main>
    </div>
  );
}
