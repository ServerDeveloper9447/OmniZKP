#!/usr/bin/env bash
# Fix all relative imports in src/components to use @/ aliases
SRC="/home/krish/github/OmniZKP/omni-zkp-web/src/components"

find "$SRC" -name "*.tsx" | while read -r f; do
  sed -i \
    -e "s|from '../ui/index'|from '@/components/ui/index'|g" \
    -e 's|from "../ui/index"|from '"'"'@/components/ui/index'"'"'|g' \
    -e "s|from '../../ui/index'|from '@/components/ui/index'|g" \
    -e 's|from "../../ui/index"|from '"'"'@/components/ui/index'"'"'|g' \
    -e "s|from '../../lib/types'|from '@/lib/types'|g" \
    -e 's|from "../../lib/types"|from '"'"'@/lib/types'"'"'|g' \
    -e "s|from '../../../lib/types'|from '@/lib/types'|g" \
    -e 's|from "../../../lib/types"|from '"'"'@/lib/types'"'"'|g' \
    -e "s|from './ContextSliders'|from '@/components/features/verification/ContextSliders'|g" \
    -e "s|from './CredentialJson'|from '@/components/features/verification/CredentialJson'|g" \
    "$f"
  echo "Patched: $f"
done
echo "All done."
