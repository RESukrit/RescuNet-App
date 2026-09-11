import React from 'react';
import { 
  ArrowUpRight, 
  Github, 
  Globe, 
  Mail, 
  MapPin, 
  Star, 
  GitFork, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  Cpu,
  Layers,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';
import { AppConfig, ProjectItem } from '../types';

interface WebsiteViewProps {
  config: AppConfig;
  onNavigateToDashboard: () => void;
  onOpenImporter: () => void;
}

export const WebsiteView: React.FC<WebsiteViewProps> = ({
  config,
  onNavigateToDashboard,
  onOpenImporter,
}) => {
  const { profile, website, source } = config;

  return (
    <div className="w-full bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Source Connection Ribbon */}
      <div className="bg-indigo-50 border-b border-indigo-100/80 px-4 py-2 text-xs text-indigo-800 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium">Active GitHub Source:</span>
            <span className="font-mono text-indigo-700 truncate">{source.url}</span>
            {source.lastSynced && (
              <span className="text-indigo-500 hidden sm:inline">• Synced {source.lastSynced}</span>
            )}
          </div>
          <button
            onClick={onOpenImporter}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 flex-shrink-0"
          >
            Change Source / Read Page
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24">
        
        {/* HERO SECTION */}
        <section className="relative pt-4 pb-8">
          <div className="max-w-3xl space-y-6">
            {website.hero.badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>{website.hero.badge}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              {website.hero.title}
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              {website.hero.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-primary-cta"
                onClick={onNavigateToDashboard}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{website.hero.ctaPrimaryText || 'View Live Dashboard'}</span>
              </button>

              <a
                id="hero-secondary-cta"
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-200 shadow-xs transition-colors"
              >
                <Github className="w-4 h-4" />
                <span>{website.hero.ctaSecondaryText || 'GitHub Profile'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>

            {profile.location && (
              <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 pt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {profile.location}
                </span>
                {profile.statusText && (
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {profile.statusText}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ABOUT & QUICK STATS */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                  Engineering Overview
                </h2>
                <h3 className="text-2xl font-bold text-slate-900">
                  {profile.headline}
                </h3>
              </div>

              <p className="text-base text-slate-600 leading-relaxed">
                {website.about.summary}
              </p>

              {website.about.bullets && website.about.bullets.length > 0 && (
                <div className="space-y-3 pt-2">
                  {website.about.bullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-slate-700">{bullet}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Column */}
            <div className="lg:col-span-4 bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Key Benchmarks
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {website.about.stats.map((stat, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 space-y-2">
                <div className="flex justify-between items-center">
                  <span>Author:</span>
                  <span className="font-semibold text-slate-800">{profile.name}</span>
                </div>
                {profile.email && (
                  <div className="flex justify-between items-center truncate">
                    <span>Contact:</span>
                    <a href={`mailto:${profile.email}`} className="text-indigo-600 hover:underline truncate">
                      {profile.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED PROJECTS SHOWCASE */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                Portfolio & Code
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Featured Projects & Repositories
              </h3>
            </div>
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View all on GitHub</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {website.projects.map((project: ProjectItem) => (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                        {project.category}
                      </span>
                      <h4 className="text-xl font-bold text-slate-900 mt-2">
                        {project.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      {project.stars !== undefined && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          {project.stars}
                        </span>
                      )}
                      {project.forks !== undefined && (
                        <span className="flex items-center gap-1 ml-1">
                          <GitFork className="w-3.5 h-3.5 text-slate-400" />
                          {project.forks}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.tags.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 mt-4 border-t border-slate-100">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <Github className="w-3 h-3" />
                      <span>Code Repository</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SKILLS & ARCHITECTURAL STACK */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              Technical Competencies
            </h2>
            <h3 className="text-2xl font-bold text-slate-900">
              Languages, Frameworks & Infrastructure
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {website.skills.map((category, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>{category.category}</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {category.items.map((item, itemIdx) => (
                    <span
                      key={itemIdx}
                      className="text-xs font-medium px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TIMELINE / HIGHLIGHTS */}
        {website.highlights && website.highlights.length > 0 && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                Career & Trajectory
              </h2>
              <h3 className="text-2xl font-bold text-slate-900">
                Experience & Milestones
              </h3>
            </div>

            <div className="space-y-4">
              {website.highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{highlight.title}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-sm font-medium text-indigo-600">{highlight.organization}</span>
                    </div>
                    <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                      {highlight.description}
                    </p>
                  </div>
                  <div className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md flex-shrink-0 self-start sm:self-auto">
                    {highlight.year}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER & CONNECT */}
        <footer className="pt-10 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-bold text-slate-900 text-base">{profile.name}</div>
            <p className="text-xs text-slate-500 mt-0.5">
              Synthesized from GitHub Pages • Built with Google AI Studio
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
                title="Personal Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onNavigateToDashboard}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-300" />
              <span>Switch to Dashboard</span>
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
