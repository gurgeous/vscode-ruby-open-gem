# add node_modules to PATH so we can run things like eslint
export PATH := "./node_modules/.bin:" + env_var('PATH')

banner *ARGS:
  @printf '\e[42;37;1m[%s] %-72s \e[m\n' "$(date +%H:%M:%S)" "{{ARGS}}"

#
# building
#

# create ruby-open-gem-0.0.1.vsix
package: check
  @just banner "Compiling..."
  tsc -p .
  @just banner "Creating vsix..."
  vsce package
  unzip -v *.vsix

# publish using VSCE_PAT token
publish: package
  vsce publish

# everything kosher?
check:
  @just banner "Checking..."
  tsc --noEmit -p .
  eslint src --ext ts
  prettier --check .

#
# dev
#

dev:
  tsc -watch -p .
