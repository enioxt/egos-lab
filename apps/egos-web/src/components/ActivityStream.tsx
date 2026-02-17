import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCommit, ExternalLink } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

const ActivityStream: React.FC = () => {
  const { commits, isLoadingCommits, setCommits, setIsLoadingCommits } = useAppStore();

  useEffect(() => {
    const load = async () => {
      setIsLoadingCommits(true);
      const { data } = await supabase
        .from('commits')
        .select('id, sha, message, author, date, url, repo')
        .order('date', { ascending: false })
        .limit(12);
      if (data) setCommits(data);
      setIsLoadingCommits(false);
    };
    load();
  }, [setCommits, setIsLoadingCommits]);

  return (
    <section id="activity" className="activity">
      <motion.div
        className="section-intro"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="section-title">Atividade Recente</h2>
        <p className="section-desc">
          Últimos commits do ecossistema — direto do Git.
        </p>
      </motion.div>

      <div className="activity-timeline">
        {isLoadingCommits && (
          <div className="activity-loading">
            <div className="pulse-dot" />
            <span>Carregando atividade...</span>
          </div>
        )}

        {!isLoadingCommits && commits.length === 0 && (
          <div className="activity-empty">
            <GitCommit size={24} opacity={0.3} />
            <p>Nenhuma atividade registrada ainda.</p>
          </div>
        )}

        {commits.map((commit, i) => (
          <motion.a
            key={commit.sha}
            href={commit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="activity-item"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="activity-line">
              <div className="activity-dot" />
            </div>
            <div className="activity-content">
              <p className="activity-message">{commit.message}</p>
              <div className="activity-meta">
                <span>{commit.author}</span>
                <span>·</span>
                <span>{new Date(commit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <span className="activity-repo">{commit.repo?.split('/')[1]}</span>
                <ExternalLink size={10} className="activity-ext" />
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
};

export default ActivityStream;
