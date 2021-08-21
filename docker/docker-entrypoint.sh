#!/bin/sh

set -ex

npm list --depth=0 @subql/cli

npx gulp configure

exec $@
