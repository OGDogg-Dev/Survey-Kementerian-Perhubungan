from pathlib import Path
import textwrap
path = Path(r"resources/js/pages/Surveys/Index.tsx")
text = path.read_text()
old_filters = '''          {/* Filters */}
          <FrostCard className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 opacity-60" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tekan / untuk mencari..."
                className="pl-8 bg-white/95 text-slate-800 placeholder:text-slate-400 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400"
              />
           
              </Input>
            </div>
            
              </div>
              <div className="flex w-full flex-col gap-1 sm:w-auto">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Aksi</span>
                <Button asChild className="w-full text-primary-foreground dark:text-primary-foreground sm:w-auto">
                  <Link href={routeOr("surveys.create", undefined, "/surveys/create")}><Plus className="mr-1 size-4" /> Buat Survei</Link>
                </Button>
              </div>
            </div>
          </FrostCard>
'''
'''
