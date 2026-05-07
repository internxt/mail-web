import { formatEmailsToList } from '@/utils/format-emails';
import type { EmailListResponse } from '@internxt/sdk/dist/mail/types';
import { InfiniteScroll, MessageCheap, MessageCheapSkeleton } from '@internxt/ui';

interface SearchEmailListProps {
  mails: EmailListResponse['emails'];
  hasMoreItems: boolean;
  loading: boolean;
  onLoadMore: () => void;
  onMailSelected: (id: string, isRead?: boolean) => void;
}

const SearchEmailList = ({ mails, hasMoreItems, loading, onLoadMore, onMailSelected }: SearchEmailListProps) => {
  const formattedMails = formatEmailsToList(mails) ?? [];
  const loader = (
    <div className="flex flex-col">
      {new Array(3).fill(0).map((_, index) => (
        <MessageCheapSkeleton key={index} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col w-full h-full">
      <div id="tray-scroll-container" className="overflow-y-auto w-full h-full min-h-0">
        {loading && (!mails || mails.length === 0) ? (
          <>
            {new Array(8).fill(0).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <MessageCheapSkeleton />
              </div>
            ))}
          </>
        ) : (
          <InfiniteScroll
            handleNextPage={onLoadMore}
            hasMoreItems={hasMoreItems}
            loader={loader}
            scrollableTarget="tray-scroll-container"
          >
            {formattedMails.map((email) => (
              <div key={email.id} className="flex items-center w-full flex-col">
                <MessageCheap email={email} onClick={onMailSelected} />
              </div>
            ))}
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
};

export default SearchEmailList;
